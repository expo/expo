import fs from 'fs';
import { EOL } from 'os';
import path from 'path';
import { Builder, Parser } from 'xml2js';

export type XMLValue = boolean | number | string | null | XMLArray | XMLObject;

export interface XMLArray extends Array<XMLValue> {}

export interface XMLObject {
  [key: string]: XMLValue | undefined;
}

export async function writeXMLAsync(options: { path: string; xml: any }): Promise<void> {
  const xml = format(options.xml);
  await fs.promises.mkdir(path.dirname(options.path), { recursive: true });
  await fs.promises.writeFile(options.path, xml);
}

export async function readXMLAsync(options: {
  path: string;
  fallback?: string | null;
}): Promise<XMLObject> {
  let contents: string = '';
  try {
    contents = await fs.promises.readFile(options.path, { encoding: 'utf8', flag: 'r' });
  } catch {
    // catch and use fallback
  }
  const parser = new Parser();
  const manifest = await parser.parseStringPromise(contents || options.fallback || '');

  return _processAndroidXML(manifest);
}

export function _processAndroidXML(manifest: any): XMLObject {
  // For strings.xml
  if (Array.isArray(manifest?.resources?.string)) {
    for (const string of manifest?.resources?.string) {
      if (string.$.translatable === 'false' || string.$.translatable === false) {
        continue;
      }

      if (!('_' in string)) {
        throw new Error(`Empty string resource not supported: ${JSON.stringify(string)}`);
      }

      string._ = unescapeAndroidString(string._);
    }
  }

  return manifest;
}

export async function parseXMLAsync(contents: string): Promise<XMLObject> {
  const xml = await new Parser().parseStringPromise(contents);
  return xml;
}

const stringTimesN = (n: number, char: string) => Array(n + 1).join(char);

export function format(manifest: any, { indentLevel = 2, newline = EOL } = {}): string {
  let xmlInput: string;
  if (typeof manifest === 'string') {
    xmlInput = manifest;
  } else if (manifest.toString) {
    const builder = new Builder({
      headless: true,
    });

    // For strings.xml
    if (Array.isArray(manifest?.resources?.string)) {
      manifest = {
        ...manifest,
        resources: {
          ...manifest.resources,
          string: manifest.resources.string.map((string: any) => {
            if (string.$.translatable === 'false' || string.$.translatable === false) {
              return string;
            }
            return { ...string, _: escapeAndroidString(string._) };
          }),
        },
      };
    }

    xmlInput = builder.buildObject(manifest);

    return xmlInput;
  } else {
    throw new Error(`Invalid XML value passed in: ${manifest}`);
  }
  const indentString = stringTimesN(indentLevel, ' ');

  let formatted = '';
  const regex = /(>)(<)(\/*)/g;
  const xml = xmlInput.replace(regex, `$1${newline}$2$3`);
  let pad = 0;
  xml
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .forEach((line: string) => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (line.match(/^<\w([^>]*[^/])?>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = stringTimesN(pad, indentString);
      formatted += padding + line + newline;
      pad += indent;
    });

  return formatted.trim();
}

/**
 * Escapes Android string literals and control characters that cannot appear literally in XML.
 *
 * @param value unescaped Android XML string literal.
 */
export function escapeAndroidString(value: string): string {
  let result = '';
  let needsQuotes = false;

  for (let index = 0; index < value.length; index++) {
    const character = value.charAt(index);
    switch (character) {
      case '"':
      case "'":
      case '@':
      case '?':
      case '\\':
        result += '\\' + character;
        break;
      case '\n':
        result += '\\n';
        break;
      case '\t':
        result += '\\t';
        break;
      default: {
        const code = value.charCodeAt(index);
        if (code < 0x20) {
          result += '\\u' + code.toString(16).padStart(4, '0');
        } else {
          result += character;
          if (
            ((index === 0 || index === value.length - 1) && character.trim() === '') ||
            (character === ' ' && value.charAt(index - 1) === ' ')
          ) {
            needsQuotes = true;
          }
        }
        break;
      }
    }
  }

  return needsQuotes ? '"' + result + '"' : result;
}

function isAsciiWhitespace(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

export function unescapeAndroidString(value: string): string {
  let start = 0;
  let end = value.length;
  // AAPT2 trims source whitespace before processing quoting and escape sequences.
  while (isAsciiWhitespace(value.charCodeAt(start))) {
    start++;
  }
  while (end > start && isAsciiWhitespace(value.charCodeAt(end - 1))) {
    end--;
  }

  let result = '';
  let inQuotes = false;
  let previousWasWhitespace = false;

  for (let index = start; index < end; index++) {
    const character = value.charAt(index);
    switch (character) {
      case ' ':
      case '\t':
      case '\n':
      case '\r':
      case '\f':
      case '\v':
        if (!inQuotes) {
          if (!previousWasWhitespace) {
            result += ' ';
          }
          previousWasWhitespace = true;
          continue;
        }
        result += character;
        break;
      case '"':
        inQuotes = !inQuotes;
        break;
      case '\\': {
        if (++index === end) {
          return result;
        }
        switch (value.charAt(index)) {
          case 'n':
            result += '\n';
            break;
          case 't':
            result += '\t';
            break;
          case 'u': {
            let cursor = index + 1;
            let code = 0;
            for (; cursor < end && cursor <= index + 4; cursor++) {
              const digit = value.charCodeAt(cursor);
              let hex: number;
              if (digit >= 0x30 && digit <= 0x39) {
                hex = digit - 0x30;
              } else if (digit >= 0x41 && digit <= 0x46) {
                hex = digit - 0x41 + 10;
              } else if (digit >= 0x61 && digit <= 0x66) {
                hex = digit - 0x61 + 10;
              } else {
                break;
              }
              code = (code << 4) | hex;
            }
            if (cursor === index + 5) {
              result += String.fromCharCode(code);
              index = cursor - 1;
            } else {
              result += 'u';
            }
            break;
          }
          default:
            result += value.charAt(index);
            break;
        }
        break;
      }
      default:
        result += character;
        break;
    }
    previousWasWhitespace = false;
  }
  return result;
}
