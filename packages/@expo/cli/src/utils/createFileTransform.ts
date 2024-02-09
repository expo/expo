import { IOSConfig } from '@expo/config-plugins';
import Minipass from 'minipass';
import path from 'path';
import picomatch from 'picomatch';
import { ReadEntry } from 'tar';

const debug = require('debug')('expo:file-transform') as typeof console.log;

function escapeXMLCharacters(original: string): string {
  const noAmps = original.replace('&', '&amp;');
  const noLt = noAmps.replace('<', '&lt;');
  const noGt = noLt.replace('>', '&gt;');
  const noApos = noGt.replace('"', '\\"');
  return noApos.replace("'", "\\'");
}

class Transformer extends Minipass {
  data = '';

  constructor(private settings: { name: string; extension: string }) {
    super();
  }

  write(data: string) {
    this.data += data;
    return true;
  }

  getNormalizedName(): string {
    if (['.xml', '.plist'].includes(this.settings.extension)) {
      return escapeXMLCharacters(this.settings.name);
    }
    return this.settings.name;
  }

  end() {
    const name = this.getNormalizedName();
    const replaced = this.data
      .replace(/Hello App Display Name/g, name)
      .replace(/HelloWorld/g, IOSConfig.XcodeUtils.sanitizedName(name))
      .replace(/helloworld/g, IOSConfig.XcodeUtils.sanitizedName(name.toLowerCase()));
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
          entry.path.includes('android')
            ? IOSConfig.XcodeUtils.sanitizedName(name.toLowerCase())
            : IOSConfig.XcodeUtils.sanitizedName(name)
        )
        .replace(/helloworld/g, IOSConfig.XcodeUtils.sanitizedName(name).toLowerCase());
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
    const extension = path.extname(entry.path);

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
        '.gz',

        // Font files
        '.otf',
        '.ttf',
      ].includes(extension) &&
      name
    ) {
      return new Transformer({ name, extension });
    }
    return undefined;
  };
}

export function createGlobFilter(
  globPattern: picomatch.Glob,
  options?: picomatch.PicomatchOptions
) {
  const matcher = picomatch(globPattern, options);

  debug(
    'filter: created for pattern(s) "%s" (%s)',
    Array.isArray(globPattern) ? globPattern.join('", "') : globPattern,
    options
  );

  return (path: string) => {
    const included = matcher(path);
    debug('filter: %s - %s', included ? 'include' : 'exclude', path);
    return included;
  };
}
