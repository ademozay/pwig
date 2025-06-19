import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { readFile, readdir } from "fs/promises";
import path from "path";
import stream from "stream";
import { PdfExporter } from "./pdfExporter/PdfExporter";
import { TwigRenderer } from "./twigRenderer/TwigRenderer";
import {
  AppError,
  ValidationError,
  NotFoundError,
  InternalError,
} from "./errors/AppError";

config();

const app = express();
const PORT = process.env.PORT || 5001;

const twigRenderer = new TwigRenderer();
const pdfExporter = new PdfExporter();

const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({ message: "An internal server error occurred" });
};

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Get all templates
app.get(
  "/api/templates",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const templatesPath = path.join(path.dirname(__dirname), "templates");
      const files = await readdir(templatesPath);
      const templates = files.filter((file) => file.endsWith(".twig"));
      res.json(templates);
    } catch (error) {
      console.error(error);

      throw new InternalError("Unable to read templates");
    }
  })
);

// Get a template by filename
app.get(
  "/api/templates/:filename",
  asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;

    try {
      const templatesPath = path.join(path.dirname(__dirname), "templates");
      const content = await readFile(
        path.join(templatesPath, filename),
        "utf-8"
      );
      const variables = await readFile(
        path.join(templatesPath, `${filename}.json`),
        "utf-8"
      );
      res.json({ content, variables });
    } catch (error: any) {
      console.error(error);

      if (error.code === "ENOENT") {
        throw new NotFoundError(`Template '${filename}' not found`);
      }

      throw new InternalError("Unable to read template");
    }
  })
);

// Render a template
app.post(
  "/api/render",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { template, variables } = req.body;

      if (!template) {
        throw new ValidationError("Template content is required");
      }

      let parsedVariables = {};
      if (variables) {
        try {
          parsedVariables =
            typeof variables === "string" ? JSON.parse(variables) : variables;
        } catch (error) {
          throw new ValidationError("Invalid JSON in variables");
        }
      }

      const { html } = await twigRenderer.render({
        template: template,
        variables: parsedVariables,
      });

      res.json({ html });
    } catch (error) {
      throw new InternalError("Unable to render template");
    }
  })
);

// Export a PDF
app.post(
  "/api/export",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { template, variables, filename } = req.body;

      if (!template) {
        throw new ValidationError("Template content is required");
      }

      let parsedVariables = {};
      if (variables) {
        try {
          parsedVariables =
            typeof variables === "string" ? JSON.parse(variables) : variables;
        } catch (error) {
          throw new ValidationError("Invalid JSON in variables");
        }
      }

      const { html } = await twigRenderer.render({
        template: template,
        variables: parsedVariables,
      });
      const pdfFilename = filename || `template-${Date.now()}.pdf`;

      const pdfBuffer = await pdfExporter.export(html);

      const readStream = new stream.PassThrough();
      readStream.end(pdfBuffer);

      res.set("Content-disposition", `attachment; filename=${pdfFilename}`);
      res.set("Content-Type", "application/pdf");

      readStream.pipe(res);
    } catch (error) {
      console.error(error);

      throw new InternalError("Unable to export PDF");
    }
  })
);

// Backend API root endpoint
app.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      message: "Pwig Backend API",
      version: process.env.npm_package_version,
      endpoints: {
        templates: "/api/templates",
        render: "/api/render",
        exportPdf: "/api/export-pdf",
      },
    });
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔧 Pwig Backend API running on http://localhost:${PORT}`);
});
