import { MonacoEditor } from "./MonacoEditor";

export class JsonEditor extends MonacoEditor {
  constructor(containerId: string) {
    super(containerId, "json");
  }

  getDefaultContent(): string {
    return `{
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "title": "Welcome",
  "items": ["Item 1", "Item 2", "Item 3"]
}`;
  }

  isValidJson(): boolean {
    try {
      JSON.parse(this.getValue());
      return true;
    } catch (error) {
      return false;
    }
  }

  getJsonData(): any {
    try {
      return JSON.parse(this.getValue());
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }

  setJsonData(data: any): void {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      this.setValue(jsonString);
    } catch (error) {
      throw new Error("Cannot convert data to JSON");
    }
  }
}
