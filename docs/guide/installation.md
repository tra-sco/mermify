# Installation

Get started with Mermify, the visual text-to-diagram hybrid editor.

## Prerequisites

Before starting, make sure you have the following installed on your system:
- [Bun](https://bun.sh) (runtime and package manager)
- [Git](https://git-scm.com) (for version control)

## Setup Instructions

Follow these simple steps to set up and run the editor locally:

### 1. Clone the Repository
```bash
git clone https://github.com/tra-sco/mermify.git
cd mermify
```

### 2. Install Dependencies
Use Bun to install the project dependencies:
```bash
bun install
```

### 3. Run the Development Server
Launch Vite's hot-reloading development server:
```bash
bun dev
```
By default, the application will run at `http://localhost:5173`.

---

## Documentation Site

To run this documentation site locally:
```bash
# Start VitePress dev server
bun run docs:dev
```
It will automatically trigger Playwright to capture the latest screenshots of the editor and then start VitePress.
