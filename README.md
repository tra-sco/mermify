# Mermify 🎨🔄

**Mermify** is a premium, visual text-to-diagram hybrid editor for [Mermaid.js](https://mermaid.js.org/) flowcharts and sequence diagrams. It bridges the gap between text-based diagramming and visual drag-and-drop editors, providing real-time, bi-directional synchronization.

[![Version](https://img.shields.io/badge/Version-v0.3.0-blue)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun Version](https://img.shields.io/badge/Runtime-Bun-black?style=flat&logo=bun)](https://bun.sh)
[![Vite](https://img.shields.io/badge/Build%20Tool-Vite-646CFF?style=flat&logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## 🚀 Live Access

*   **[Launch the Mermify Editor](https://tra-sco.github.io/mermify/)**
*   **[Read the Full Documentation](https://tra-sco.github.io/mermify/docs/)**

---

## 📸 Workspace Preview

![Mermify Editor Workspace](docs/public/screenshots/initial-state.png)

---

## 🕹️ Interactive Features

| 🔗 Drag to Connect Nodes | 🌿 Drag to Spawn New Nodes |
| :---: | :---: |
| Hover over any node, click & drag the green connector socket, and drop onto another node to quickly link them together. | Drag from any node socket into empty space on the canvas to instantly spawn a new node connected to the source. |
| ![Drag to Connect Nodes](docs/public/screenshots/drag-connect.svg) | ![Drag to Spawn Nodes](docs/public/screenshots/drag-spawn.svg) |

---


## ✨ Features

*   **🔄 Bi-Directional Real-Time Sync:** Edit raw Mermaid code in a fully featured Monaco Editor, or edit visually in the live preview canvas. Changes sync instantly both ways for both flowcharts and sequence diagrams.
*   **⚡ Visual Sequence Diagram Editor:** Edit sequence diagrams visually! Add/reorder participants and messages, and customize message types (solid, dotted, arrows) through interactive canvas overlays.
*   **🖱️ Visual Flowchart Editor:** Drag from the socket indicator on any node to an empty canvas area to instantly spawn a new connected node, or connect existing nodes by dragging from socket to socket.
*   **🔮 Premium Glassmorphism UI:** Built with a stunning modern glassmorphic interface, dark mode support, customized overlay controls, smooth transitions, and custom scrollbars.
*   **📋 Property Editors:** Click any node or edge in the visual preview to customize labels, change shapes (choose from 11 custom Mermaid shapes), or alter line styles (solid, dotted, bold, etc.) through modern modal dialogs.
*   **🎛️ Diagram Presets:** Instantly toggle between flowchart templates and sequence diagram setups in the header to start building faster.
*   **📤 High-Quality Exports:** Export your diagrams to SVG, download them as PNG, copy PNG directly to your clipboard, or copy a compressed shareable state link.

---

## 🛠️ Local Development Setup

To run Mermify on your local machine:

### Prerequisites

Ensure you have [Bun](https://bun.sh) installed.

### 1. Clone and Install
```bash
git clone https://github.com/tra-sco/mermify.git
cd mermify
bun install
```

### 2. Run the Development Server
```bash
bun dev
```
Open your browser to `http://localhost:5173`.

### 3. Run the Documentation Site Locally
To run the VitePress documentation server locally:
```bash
bun run docs:dev
```
Open your browser to `http://localhost:8002/docs/`.

---

## 🐳 Self-Hosting

Mermify also ships as a container image and Helm chart, published on every push to `main`.

### Docker

```bash
docker run --rm -p 8080:8080 ghcr.io/tra-sco/mermify:latest
```

### Helm

```bash
helm install mermify oci://ghcr.io/tra-sco/charts/mermify --version <x.y.z>
```

See [`chart/README.md`](chart/README.md) for configuration (ingress, autoscaling, resource
limits, CSP, etc).

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
