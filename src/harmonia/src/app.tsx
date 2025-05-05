import { createRoot } from 'react-dom/client';
// import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MusicPlayer from './screens/Player';

const root = createRoot(document.body);
root.render(
  <MusicPlayer />
);
