declare global {
  interface Window {
    hasUnsavedChanges: boolean;
    setUnsavedChanges: (hasChanges?: boolean) => void;
  }
}

export {};