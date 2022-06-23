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

  // For strings.xml
  if (Array.isArray(manifest?.resources?.string)) {
    for (const string of manifest?.resources?.string) {
      if (string.$.translatable === 'false' || string.$.translatable === false) {
        continue;
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
      for (const string of manifest?.resources?.string) {
        if (string.$.translatable === 'false' || string.$.translatable === false) {
          continue;
        }
        string._ = escapeAndroidString(string._);
      }
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
 * Escapes Android string literals, specifically characters `"`, `'`, `\`, `\n`, `\r`, `\t`
 *
 * @param value unescaped Android XML string literal.
 */
export function escapeAndroidString(value: string): string {
  value = value.replace(/[\n\r\t'"@]/g, m => {
    switch (m) {
      case '"':
      case "'":
      case '@':
        return '\\' + m;
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\t':
        return '\\t';
      default:
        throw new Error(`Cannot escape unhandled XML character: ${m}`);
    }
  });
  if (value.match(/(^\s|\s$)/)) {
    value = '"' + value + '"';
  }
  return value;
}

export function unescapeAndroidString(value: string): string {
  return value.replace(/\\(.)/g, '$1');
}
