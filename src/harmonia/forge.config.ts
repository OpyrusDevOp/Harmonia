import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

// Import fs-extra and path using ESM syntax
import fs from 'fs-extra';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // Use an async function for afterCopy to handle file operations
    afterCopy: [
      async (buildPath: string) => {
        const appDir = path.join(buildPath, 'usr');
        await fs.ensureDir(appDir);
        await fs.move(
          path.join(buildPath, 'resources'),
          path.join(appDir, 'share', 'harmonia'), // Match your app name
          { overwrite: true }
        );
        await fs.move(
          path.join(buildPath, 'harmonia'), // Match your executable name
          path.join(appDir, 'bin', 'harmonia'),
          { overwrite: true }
        );
      },
    ],
    executableName: 'harmonia', // Match your app's executable name
    platform: 'linux', // Optional, can be overridden by --platform
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        maintainer: 'Your Name <your.email@example.com>',
        homepage: 'https://github.com/yourusername/your-repo',
        productName: 'harmonia',
        bin: 'usr/bin/harmonia',
      },
    }),
    new MakerRpm({
      options: {
        maintainer: 'Your Name <your.email@example.com>',
        homepage: 'https://github.com/yourusername/your-repo',
        productName: 'harmonia',
        bin: 'usr/bin/harmonia',
        depends: ['gtk3', 'libnotify', 'nss', 'alsa-lib', 'libxss', 'libxtst'],
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
