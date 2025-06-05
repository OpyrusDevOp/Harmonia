# Harmonia

A modern, cross-platform music player built with Electron, React, and TypeScript. Harmonia lets you scan, organize, and play your local music library with a beautiful, responsive interface.

## Features

- 🎵 **Scan and manage your local music library**
- 📂 **Create and manage playlists**
- 🕑 **Recently played tracking**
- 🔍 **Search, sort, and filter your music**
- 🖥️ **Media session integration** (hardware/media keys support)
- ⚡ **Fast, responsive UI** with React and TailwindCSS
- 🖼️ **Album art and metadata display**
- 🏁 **Cross-platform packaging** (Windows, macOS, Linux)

## Screenshots
<!-- Add screenshots here if available -->

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Harmonia/src/harmonia
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running in Development

Start the Electron app in development mode:
```bash
npm start
```

### Linting

Run ESLint to check for code quality and style issues:
```bash
npm run lint
```

### Building & Packaging

To package the app for your OS:
```bash
npm run make
```
The output will be in the `out/` directory.

## Project Structure

- `src/` - Main source code
  - `main.ts` - Electron main process
  - `renderer.ts` - Renderer process entry
  - `app.tsx` - React app entry
  - `components/` - Reusable UI components
  - `screens/` - Main UI screens (e.g., Player)
  - `services/` - Backend and utility services
  - `types/` - TypeScript type definitions
- `index.html` - Main HTML entry point
- `package.json` - Project metadata and scripts
- `vite.*.config.ts` - Vite build configurations
- `forge.config.ts` - Electron Forge packaging config

## Technologies Used

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [music-metadata](https://github.com/Borewit/music-metadata)

## License

This project is licensed under the MIT License.

---

**Author:** OpyrusDevOp (<opyrusdeveloper@gmail.com>) 