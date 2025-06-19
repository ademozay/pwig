import * as monaco from "monaco-editor";

export type ChangeCallback = (value: string) => void;

export abstract class MonacoEditor {
  protected containerId: string;
  protected languageId: string;
  public editor: monaco.editor.IStandaloneCodeEditor | null = null;
  protected options: monaco.editor.IStandaloneEditorConstructionOptions;
  protected changeCallbacks: ChangeCallback[] = [];

  constructor(
    containerId: string,
    languageId: string,
    options: monaco.editor.IStandaloneEditorConstructionOptions = {}
  ) {
    if (this.constructor === MonacoEditor) {
      throw new Error(
        "MonacoEditor is abstract and cannot be instantiated directly"
      );
    }

    this.containerId = containerId;
    this.languageId = languageId;
    this.options = {
      theme: "vs-dark",
      automaticLayout: true,
      wordWrap: "on",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      renderWhitespace: "selection",
      matchBrackets: "always",
      formatOnPaste: true,
      formatOnType: true,
      ...options,
    };
  }

  abstract getDefaultContent(): string;

  initialize(): void {
    this.createEditor();
    this.setupEventListeners();
  }

  onChange(callback: ChangeCallback): void {
    if (typeof callback === "function") {
      this.changeCallbacks.push(callback);
    }
  }

  getValue(): string {
    return this.editor?.getValue() ?? "";
  }

  setValue(value: string): void {
    this.editor?.setValue(value);
  }

  format(): void {
    this.editor?.getAction("editor.action.formatDocument")?.run();
  }

  dispose(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }

  private createEditor(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with id "${this.containerId}" not found`);
    }

    this.editor = monaco.editor.create(container, {
      language: this.languageId,
      value: this.getDefaultContent(),
      ...this.options,
    } as monaco.editor.IStandaloneEditorConstructionOptions);
  }

  private setupEventListeners(): void {
    if (this.editor) {
      this.editor.onDidChangeModelContent(() => {
        this.notifyChange();
      });
    }
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach((callback) => {
      try {
        callback(this.getValue());
      } catch (error) {
        console.error("Error in editor change callback:", error);
      }
    });
  }
}
