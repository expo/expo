import Minipass from 'minipass';
import path from 'path';
import { ReadEntry } from 'tar';

export function sanitizedName(name: string) {
  return name
    .replace(/[\W_]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

class Transformer extends Minipass {
  data: string;

  constructor(private name: string) {
    super();
    this.data = '';
  }
  write(data: string) {
    this.data += data;
    return true;
  }
  end() {
    const replaced = this.data
      .replace(/Hello App Display Name/g, this.name)
      .replace(/HelloWorld/g, sanitizedName(this.name))
      .replace(/helloworld/g, sanitizedName(this.name.toLowerCase()));
    super.write(replaced);
    return super.end();
  }
}

export function createEntryResolver(name: string) {
  return (entry: ReadEntry) => {
    if (name) {
      // Rewrite paths for bare workflow
      entry.path = entry.path
        .replace(
          /HelloWorld/g,
          entry.path.includes('android') ? sanitizedName(name.toLowerCase()) : sanitizedName(name)
        )
        .replace(/helloworld/g, sanitizedName(name).toLowerCase());
    }
    if (entry.type && /^file$/i.test(entry.type) && path.basename(entry.path) === 'gitignore') {
      // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
      // See: https://github.com/npm/npm/issues/1862
      entry.path = entry.path.replace(/gitignore$/, '.gitignore');
    }
  };
}

export function createFileTransform(name: string) {
  return (entry: ReadEntry) => {
    // Binary files, don't process these (avoid decoding as utf8)
    if (
      ![
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.webp',
        '.psd',
        '.tiff',
        '.svg',
        '.jar',
        '.keystore',
        // Font files
        '.otf',
        '.ttf',
      ].includes(path.extname(entry.path)) &&
      name
    ) {
      return new Transformer(name);
    }
    return undefined;
  };
}
