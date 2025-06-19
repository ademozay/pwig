import { twig } from "twig";

export type TemplateVariables = Record<string, unknown>;

export type TemplateRenderOptions = {
  template: string;
  variables: TemplateVariables;
};

export type TemplateRenderResult = {
  html: string;
};

export class TwigRenderer {
  async render({
    template,
    variables,
  }: TemplateRenderOptions): Promise<TemplateRenderResult> {
    const twigTemplate = twig({ async: true, data: template });
    const html = await twigTemplate.renderAsync(variables);
    return { html };
  }
}
