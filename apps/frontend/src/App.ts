import Split from "split.js";
import { Api } from "./api/Api";
import { ApiError } from "./api/ApiError";
import { JsonEditor } from "./components/editors/JsonEditor";
import { TwigEditor } from "./components/editors/TwigEditor";
import { showToast } from "./utils/Toast";

const UNKNOWN_ERROR_MESSAGE = "Unknown error";

export class App {
  private twigEditor: TwigEditor | null = null;
  private jsonEditor: JsonEditor | null = null;
  private isRendering: boolean = false;
  private renderTimeout: NodeJS.Timeout | null = null;
  private api: Api;
  private previousTemplateSelection: string = "";

  constructor() {
    this.api = new Api();
    this.init();
  }

  private async init(): Promise<void> {
    this.initEditors();
    this.setupSplits();
    this.setupEventListeners();
    this.renderPreview();
    await this.loadTemplates();
  }

  private initEditors(): void {
    this.twigEditor = new TwigEditor("twigEditor");
    this.jsonEditor = new JsonEditor("jsonEditor");

    this.twigEditor.onChange(() => {
      this.scheduleRender();
      if (window.setUnsavedChanges) {
        window.setUnsavedChanges(true);
      }
    });

    this.jsonEditor.onChange(() => {
      this.scheduleRender();
      if (window.setUnsavedChanges) {
        window.setUnsavedChanges(true);
      }
    });

    this.twigEditor.initialize();
    this.jsonEditor.initialize();
  }

  private setupSplits(): void {
    const commonConfig = {
      gutterSize: 8,
      gutterAlign: "center",
      snapOffset: 30,
      dragInterval: 1,
      onDragEnd: () =>
        setTimeout(() => {
          if (this.twigEditor?.editor) {
            this.twigEditor.editor.layout();
          }
          if (this.jsonEditor?.editor) {
            this.jsonEditor.editor.layout();
          }
        }, 50),
    };

    Split(["#left-panel", "#right-panel"], {
      ...commonConfig,
      sizes: [50, 50],
      minSize: [300, 300],
      direction: "horizontal",
      cursor: "col-resize",
    });

    Split(["#twig-section", "#json-section"], {
      ...commonConfig,
      sizes: [60, 40],
      minSize: [200, 150],
      direction: "vertical",
      cursor: "row-resize",
    });
  }

  private setupEventListeners(): void {
    const templateSelector = document.getElementById("templateSelector");
    const exportPdfButton = document.getElementById("exportPdfBtn");

    if (!templateSelector || !exportPdfButton) {
      showToast("Required elements not found. Please refresh the page.");
      return;
    }

    templateSelector.addEventListener(
      "change",
      this.handleTemplateSelection.bind(this)
    );
    exportPdfButton.addEventListener("click", this.exportToPdf.bind(this));
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templateSelector = document.getElementById("templateSelector");
      if (!templateSelector) {
        showToast("Template selector not found. Please refresh the page.");
        return;
      }

      const templates = await this.api.fetchTemplates();
      templates.forEach((template) => {
        const option = document.createElement("option");
        option.value = template;
        option.textContent = template.replace(".twig", "");
        templateSelector.appendChild(option);
      });
    } catch (error) {
      console.error(error);

      if (error instanceof ApiError) {
        showToast(error.message, "error");
        return;
      }

      showToast(UNKNOWN_ERROR_MESSAGE, "error");
    }
  }

  private async loadTemplate(filename: string): Promise<void> {
    try {
      const data = await this.api.fetchTemplate(filename);
      if (this.twigEditor) {
        this.twigEditor.setValue(data.content);
      }
      if (this.jsonEditor) {
        this.jsonEditor.setValue(data.variables);
      }

      this.previousTemplateSelection = filename;

      if (window.setUnsavedChanges) {
        window.setUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Unable to load template:", error);

      const templateSelector = document.getElementById(
        "templateSelector"
      ) as HTMLSelectElement | null;
      if (templateSelector) {
        templateSelector.value = this.previousTemplateSelection;
      }

      if (error instanceof ApiError) {
        showToast(error.message, "error");
        return;
      }

      showToast(UNKNOWN_ERROR_MESSAGE, "error");
    }
  }

  private async renderPreview(): Promise<void> {
    if (this.isRendering) {
      return;
    }

    const previewContainer = document.getElementById("previewContainer");
    if (!previewContainer) {
      showToast("Preview container not found. Please refresh the page.");
      return;
    }

    this.isRendering = true;

    try {
      const template = this.twigEditor?.getValue() || "";
      const variables = this.jsonEditor?.getValue() || "{}";

      const { html } = await this.api.renderTemplate(template, variables);
      this.renderInIframe(previewContainer, html);
    } catch (error) {
      console.error("Unable to render template:", error);

      if (error instanceof ApiError) {
        showToast(error.message, "error");
        return;
      }

      showToast(UNKNOWN_ERROR_MESSAGE, "error");
    } finally {
      this.isRendering = false;
    }
  }

  private async exportToPdf(): Promise<void> {
    const exportButton = document.getElementById(
      "exportPdfBtn"
    ) as HTMLButtonElement | null;
    if (!exportButton) {
      showToast("Export button not found. Please refresh the page.");
      return;
    }

    const originalText = exportButton.textContent;

    exportButton.disabled = true;
    exportButton.textContent = "⏳ Generating PDF...";
    exportButton.style.cursor = "progress";

    try {
      const template = this.twigEditor?.getValue() || "";
      const variables = this.jsonEditor?.getValue() || "{}";

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `document-${timestamp}.pdf`;

      const blob = await this.api.exportToPdf(template, variables, filename);
      this.downloadBlob(blob, filename);
      showToast(`PDF exported successfully: ${filename}`, "success");
    } catch (error) {
      console.error("PDF export error:", error);

      if (error instanceof ApiError) {
        showToast(error.message, "error");
        return;
      }

      showToast(UNKNOWN_ERROR_MESSAGE, "error");
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = originalText || "📄 Export to PDF";
      exportButton.style.cursor = "pointer";
    }
  }

  private scheduleRender(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    this.renderTimeout = setTimeout(() => {
      this.renderPreview();
    }, 500);
  }

  private renderInIframe(container: HTMLElement, htmlContent: string): void {
    const iframe = document.createElement("iframe");
    iframe.className = "preview-iframe";
    iframe.setAttribute("sandbox", "allow-same-origin");

    container.innerHTML = "";
    container.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const styledContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    iframeDoc.open();
    iframeDoc.write(styledContent);
    iframeDoc.close();
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private handleTemplateSelection(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;

    if (window.hasUnsavedChanges) {
      const confirmed = confirm(
        "You have unsaved changes. Loading a new template will discard all your changes. Do you want to continue?"
      );

      if (!confirmed) {
        target.value = this.previousTemplateSelection;
        return;
      }
    }

    this.loadTemplate(selectedValue);
  }
}
