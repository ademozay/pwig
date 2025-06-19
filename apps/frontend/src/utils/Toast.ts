export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export type ToastOptions = {
  type?: ToastType;
  duration?: number;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  dismissible: boolean;
  action?: ToastOptions["action"];
  element?: HTMLElement;
};

class ToastManager {
  private toasts: Map<string, ToastItem> = new Map();
  private container: HTMLElement | null = null;
  private position: ToastOptions["position"] = "top-right";

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    this.container.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 420px;
      transition: all 0.3s ease;
    `;
    this.updateContainerPosition();
    document.body.appendChild(this.container);
  }

  private updateContainerPosition(): void {
    if (!this.container) return;

    const positions = {
      "top-left": { top: "16px", left: "16px", right: "auto", bottom: "auto" },
      "top-right": { top: "16px", right: "16px", left: "auto", bottom: "auto" },
      "top-center": {
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        right: "auto",
        bottom: "auto",
      },
      "bottom-left": {
        bottom: "16px",
        left: "16px",
        right: "auto",
        top: "auto",
      },
      "bottom-right": {
        bottom: "16px",
        right: "16px",
        left: "auto",
        top: "auto",
      },
      "bottom-center": {
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        right: "auto",
        top: "auto",
      },
    };

    const pos = positions[this.position!];
    if (pos) {
      Object.assign(this.container.style, pos);
    }
  }

  setPosition(position: ToastOptions["position"]): void {
    this.position = position || "top-right";
    this.updateContainerPosition();
  }

  private createToastElement(toast: ToastItem): HTMLElement {
    const element = document.createElement("div");
    element.className = `toast toast-${toast.type}`;
    element.style.cssText = `
      pointer-events: auto;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 420px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #1f2937;
      position: relative;
      overflow: hidden;
      transform: translateX(${
        this.position?.includes("right")
          ? "100%"
          : this.position?.includes("left")
          ? "-100%"
          : "0"
      });
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Icon
    const icon = this.createIcon(toast.type);
    element.appendChild(icon);

    // Content
    const content = document.createElement("div");
    content.style.flex = "1";
    content.textContent = toast.message;
    element.appendChild(content);

    // Action button
    if (toast.action) {
      const actionBtn = document.createElement("button");
      actionBtn.textContent = toast.action.label;
      actionBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      `;
      actionBtn.addEventListener("click", toast.action.onClick);
      actionBtn.addEventListener("mouseenter", () => {
        actionBtn.style.background = "#2563eb";
      });
      actionBtn.addEventListener("mouseleave", () => {
        actionBtn.style.background = "#3b82f6";
      });
      element.appendChild(actionBtn);
    }

    // Close button
    if (toast.dismissible) {
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: color 0.2s;
      `;
      closeBtn.addEventListener("click", () => this.dismiss(toast.id));
      closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.color = "#374151";
      });
      closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.color = "#6b7280";
      });
      element.appendChild(closeBtn);
    }

    // Type-specific styling
    const typeStyles = {
      success: { borderLeft: "4px solid #10b981", background: "#f0fdf4" },
      error: { borderLeft: "4px solid #ef4444", background: "#fef2f2" },
      warning: { borderLeft: "4px solid #f59e0b", background: "#fffbeb" },
      info: { borderLeft: "4px solid #3b82f6", background: "#eff6ff" },
      loading: { borderLeft: "4px solid #6b7280", background: "#f9fafb" },
    };

    Object.assign(element.style, typeStyles[toast.type]);

    // Animate in
    requestAnimationFrame(() => {
      element.style.transform = "translateX(0)";
      element.style.opacity = "1";
    });

    return element;
  }

  private createIcon(type: ToastType): HTMLElement {
    const icon = document.createElement("div");
    icon.style.cssText = `
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    `;

    const iconMap = {
      success: { symbol: "✓", bg: "#10b981", color: "#fff" },
      error: { symbol: "✕", bg: "#ef4444", color: "#fff" },
      warning: { symbol: "⚠", bg: "#f59e0b", color: "#fff" },
      info: { symbol: "i", bg: "#3b82f6", color: "#fff" },
      loading: { symbol: "↻", bg: "#6b7280", color: "#fff" },
    };

    const config = iconMap[type];
    icon.style.background = config.bg;
    icon.style.color = config.color;
    icon.textContent = config.symbol;

    if (type === "loading") {
      icon.style.animation = "spin 1s linear infinite";
      if (!document.querySelector("#toast-spin-keyframes")) {
        const style = document.createElement("style");
        style.id = "toast-spin-keyframes";
        style.textContent = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }

    return icon;
  }

  show(message: string, options: ToastOptions = {}): string {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastItem = {
      id,
      message,
      type: options.type || "info",
      duration: options.duration || (options.type === "error" ? 5000 : 3000),
      dismissible: options.dismissible !== false,
      action: options.action,
    };

    toast.element = this.createToastElement(toast);
    this.toasts.set(id, toast);

    if (this.container) {
      if (this.position?.includes("bottom")) {
        this.container.insertBefore(toast.element, this.container.firstChild);
      } else {
        this.container.appendChild(toast.element);
      }
    }

    // Auto dismiss
    if (toast.duration > 0 && toast.type !== "loading") {
      setTimeout(() => {
        this.dismiss(id);
      }, toast.duration);
    }

    return id;
  }

  dismiss(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast || !toast.element) return;

    // Animate out
    toast.element.style.transform = `translateX(${
      this.position?.includes("right")
        ? "100%"
        : this.position?.includes("left")
        ? "-100%"
        : "0"
    })`;
    toast.element.style.opacity = "0";

    setTimeout(() => {
      if (toast.element?.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.delete(id);
    }, 300);
  }

  dismissAll(): void {
    for (const [id] of this.toasts) {
      this.dismiss(id);
    }
  }

  update(
    id: string,
    message: string,
    options: Partial<ToastOptions> = {}
  ): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    this.dismiss(id);
    this.show(message, { ...options, type: options.type || toast.type });
  }
}

// Create singleton instance
const toastManager = new ToastManager();

// Export convenience functions
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, "type">) =>
    toastManager.show(message, { ...options, type: "success" }),

  error: (message: string, options?: Omit<ToastOptions, "type">) =>
    toastManager.show(message, { ...options, type: "error" }),

  info: (message: string, options?: Omit<ToastOptions, "type">) =>
    toastManager.show(message, { ...options, type: "info" }),

  warning: (message: string, options?: Omit<ToastOptions, "type">) =>
    toastManager.show(message, { ...options, type: "warning" }),

  loading: (message: string, options?: Omit<ToastOptions, "type">) =>
    toastManager.show(message, { ...options, type: "loading", duration: 0 }),

  dismiss: (id: string) => toastManager.dismiss(id),

  dismissAll: () => toastManager.dismissAll(),

  setPosition: (position: ToastOptions["position"]) =>
    toastManager.setPosition(position),

  update: (id: string, message: string, options?: Partial<ToastOptions>) =>
    toastManager.update(id, message, options),
};

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info"
) => {
  toast.setPosition("bottom-right");

  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    default:
      toast.info(message);
      break;
  }
};
