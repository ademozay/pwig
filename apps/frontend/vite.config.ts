import { defineConfig, loadEnv } from "vite";
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      monacoEditorEsmPlugin({
        languageWorkers: ["editorWorkerService", "typescript", "json", "html"],
      }),
    ],
    server: {
      port: env.FRONTEND_PORT ? parseInt(env.FRONTEND_PORT) : 5000,
      proxy: {
        "/api": {
          target: env.API_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["split.js"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["monaco-editor", "split.js"],
    },
    define: {
      global: "globalThis",
    },
  };
});
