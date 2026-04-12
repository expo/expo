import path from 'path';

const fs = jest.requireActual('fs') as typeof import('fs');
const template = path.join(__dirname, '../../../../../../templates/expo-template-bare-minimum/');

export function readAllFiles(): Record<string, string> {
  const files: Record<string, string | Buffer> = {};

  function readFile(file: string) {
    const p = path.join(template, file);
    if (fs.statSync(p).isDirectory()) {
      fs.readdirSync(p).forEach((f) => {
        readFile(`${file}/${f}`);
      });
    } else {
      if (file.match(/\.(png)$/)) {
        const contents = fs.readFileSync(p);
        files[file] = contents;
      } else {
        const contents = fs.readFileSync(p, 'utf-8');
        files[file] = contents;
      }
    }
  }

  fs.readdirSync(path.join(template, 'ios')).forEach((file) => {
    readFile(`ios/${file}`);
  });
  fs.readdirSync(path.join(template, 'android')).forEach((file) => {
    readFile(`android/${file}`);
  });

  return files as any;
}

export default readAllFiles();
