# Harmonia

A modern, cross-platform music player built with Electron, React, and TypeScript. Harmonia lets you scan, organize, and play your local music library with a beautiful, responsive interface.

I wanted a good looking player on Linux so there we go (Rhythm was good but mehh)
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
#### HOME
![image](https://github.com/user-attachments/assets/af07cade-a54f-4c2a-94c2-cf80fabb4d69)
#### Playlist 
![image](https://github.com/user-attachments/assets/49a13267-f313-48bb-abda-92dcb3943c1b)
#### Library
![image](https://github.com/user-attachments/assets/d753f57b-817c-4bb9-a905-44ee08547bbb)
#### Side Player
![image](https://github.com/user-attachments/assets/ff66e305-929a-48ac-b934-319bb798d66b)
#### Fullscreen Player
![image](https://github.com/user-attachments/assets/83e27ad2-a19f-41ba-9696-527c23a8b588)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OpyrusDevOp/Harmonia.git
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
