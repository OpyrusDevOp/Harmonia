import * as fs from 'fs-extra';
import mime from 'mime-types';

export class ImageService {
  async getImageDataUrl(filePath: string): Promise<string> {
    try {
      const platform = process.platform;
      console.log('Reading image file: ', filePath);

      let correctPath: string;
      if (platform === 'win32') {
        correctPath = filePath.replace('file:///', '');
      } else if (platform === 'darwin') {
        console.log('Running on macOS');
        correctPath = filePath.replace('file://', '');
      } else if (platform === 'linux') {
        correctPath = filePath.replace('file://', '');
      } else {
        correctPath = filePath.replace('file://', '');
      }

      const buffer = await fs.readFile(correctPath);
      const mimeType = mime.lookup(filePath) || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const url = `data:${mimeType};base64,${base64}`;

      return url;
    } catch (err) {
      console.error('Error reading image file:', err);
      return '';
    }
  }
}
