import { MonacoEditor } from "./MonacoEditor";

export class TwigEditor extends MonacoEditor {
  constructor(containerId: string) {
    super(containerId, "twig", { stickyScroll: { enabled: false } });
  }

  getDefaultContent(): string {
    return `<h1>{{ title }}</h1>
<p>Hello {{ user.name }}!</p>
<p>Email: {{ user.email }}</p>

<h2>Items:</h2>
<ul>
{% for item in items %}
  <li>{{ item }}</li>
{% endfor %}
</ul>`;
  }
}
