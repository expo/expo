import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

/**
 * @typedef {import('@types/mdast').Root} Root - https://github.com/syntax-tree/mdast#root
 * @typedef {import('vfile').VFile} VFile - https://github.com/syntax-tree/unist#file
 */

const DEFAULT_OPTIONS = {
  publicDir: 'public',
  components: ['ContentSpotlight'],
};

/**
 * This injects `width` and `height` props on image components that reference a static image,
 * read from the actual image file on disk at build time. Browsers use these attributes to
 * reserve correctly-shaped space before the image loads, avoiding layout shift
 * (see the Lighthouse `unsized-images` audit). Rendered size is unaffected, CSS still wins.
 *
 * Only components with a literal `src` starting with `/static/` are processed,
 * and explicit `width`/`height` props on the component are left untouched.
 *
 * @param {object} options
 * @param {string} [options.publicDir="public"]
 * @param {string[]} [options.components=["ContentSpotlight"]]
 * @returns {function} remark plugin
 */
export default function remarkImageSize(options) {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  /**
   * @param {Root} tree
   * @param {VFile} file
   */
  return (tree, file) => {
    // we can't resolve image files without knowing the project root
    if (!file.cwd) {
      return;
    }

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], node => {
      if (!settings.components.includes(node.name)) {
        return;
      }

      const attributes = node.attributes.filter(attribute => attribute.type === 'mdxJsxAttribute');
      const src = attributes.find(attribute => attribute.name === 'src')?.value;

      if (typeof src !== 'string' || !src.startsWith('/static/')) {
        return;
      }
      if (attributes.some(attribute => attribute.name === 'width' || attribute.name === 'height')) {
        return;
      }

      const size = getImageSize(path.join(file.cwd, settings.publicDir, src));
      if (size) {
        node.attributes.push(numericAttribute('width', size.width));
        node.attributes.push(numericAttribute('height', size.height));
      }
    });
  };
}

/**
 * Create an MDX JSX attribute holding a numeric expression, like `width={840}`.
 */
function numericAttribute(name, value) {
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: String(value),
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          comments: [],
          body: [
            {
              type: 'ExpressionStatement',
              expression: { type: 'Literal', value, raw: String(value) },
            },
          ],
        },
      },
    },
  };
}

/**
 * Read the pixel dimensions from an image file's header.
 * Supports the formats used in the docs: PNG, JPEG, WebP, and AVIF.
 *
 * @param {string} filePath
 * @returns {{ width: number, height: number } | null} null when the file is missing or unsupported
 */
export function getImageSize(filePath) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return null;
  }

  const size = parseImageSize(buffer);
  return size && size.width > 0 && size.height > 0 ? size : null;
}

function parseImageSize(buffer) {
  if (buffer.length < 30) {
    return null;
  }
  // PNG: IHDR is always the first chunk, width/height at fixed offsets
  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: scan segment markers for a start-of-frame (SOF) segment
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return parseJpegSize(buffer);
  }
  // WebP: RIFF container, layout depends on the first chunk type
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return parseWebpSize(buffer);
  }
  // AVIF: ISOBMFF container, dimensions live in the `ispe` (image spatial extents) box
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const index = buffer.indexOf('ispe');
    if (index >= 0 && index + 16 <= buffer.length) {
      return { width: buffer.readUInt32BE(index + 8), height: buffer.readUInt32BE(index + 12) };
    }
  }
  return null;
}

function parseJpegSize(buffer) {
  let index = 2;
  while (index + 9 < buffer.length) {
    if (buffer[index] !== 0xff) {
      index += 1;
      continue;
    }
    const marker = buffer[index + 1];
    // 0xff padding and standalone markers carry no length bytes
    if (marker === 0xff) {
      index += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      index += 2;
      continue;
    }
    // SOF0-SOF15 hold the frame size, except DHT (0xc4), JPG (0xc8), and DAC (0xcc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buffer.readUInt16BE(index + 7), height: buffer.readUInt16BE(index + 5) };
    }
    index += 2 + buffer.readUInt16BE(index + 2);
  }
  return null;
}

function parseWebpSize(buffer) {
  const chunkType = buffer.toString('ascii', 12, 16);
  // extended format: 24-bit little-endian canvas size minus one
  if (chunkType === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  // lossy format: 14-bit dimensions after the frame tag and start code
  if (chunkType === 'VP8 ' && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  // lossless format: 14-bit dimensions minus one, packed after the 0x2f signature
  if (chunkType === 'VP8L' && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}
