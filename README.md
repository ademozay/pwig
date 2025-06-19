# 🎨 Pwig

A modern web-based Twig template editor with real-time preview capabilities. This monorepo contains both the backend API and frontend application for creating, editing, and exporting PDF documents from Twig templates.

## Features

- **Monaco Editor Integration**: Professional code editor with Twig syntax highlighting
- **Live Preview**: Real-time template rendering as you type
- **Template Management**: Load and edit existing Twig templates
- **Variable Support**: JSON-based template variables with live editing
- **PDF Generation**: Generate PDF from Twig templates using Puppeteer

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone git@github.com:ademozay/pwig.git
cd pwig
```

2. Install dependencies for all apps:
```bash
npm i
```

3. Copy environment files:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### Running the application
You can either start the development server, or you can build and start the app.

* Start the development server (both backend and frontend):
```bash
npm run dev
```

* Build and start the app (both backend and frontend):
```bash
npm start
```

Open your browser and navigate to `http://localhost:5000`
