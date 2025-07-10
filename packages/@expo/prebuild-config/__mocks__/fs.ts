const fs = require('memfs').fs;

// Add fs.promises.cp polyfill for memfs since it doesn't support it
fs.promises.cp = async (src: string, dest: string, options?: { recursive?: boolean }) => {
  const path = require('path');

  const srcStat = await fs.promises.stat(src);

  if (srcStat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await fs.promises.cp(srcPath, destPath, options);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  } else {
    await fs.promises.copyFile(src, dest);
  }
};

module.exports = fs;

jest.mock('node:fs', () => require('memfs').fs);
