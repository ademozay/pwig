import { ApiError } from "./ApiError";

export type Template = {
  content: string;
  variables: string;
};

export type RenderResponse = {
  html: string;
};

export class Api {
  async fetchTemplates(): Promise<string[]> {
    const response = await fetch("/api/templates");
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message);
    }

    const templates: string[] = await response.json();
    return templates.sort();
  }

  async fetchTemplate(filename: string): Promise<Template> {
    const response = await fetch(`/api/templates/${filename}`);
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message);
    }

    return await response.json();
  }

  async renderTemplate(
    template: string,
    variables: string
  ): Promise<RenderResponse> {
    const response = await fetch("/api/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template,
        variables,
      }),
    });

    const data: RenderResponse | ApiError = await response.json();
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message);
    }

    return data as RenderResponse;
  }

  async exportToPdf(
    template: string,
    variables: string,
    filename: string
  ): Promise<Blob> {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template,
        variables,
        filename,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message);
    }

    return await response.blob();
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
}
