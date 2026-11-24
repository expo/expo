import { Asset } from 'expo-asset';

import { FONT_FACES } from './fonts.generated';

// `expo-font` cannot give a font face a `unicode-range`. Without it, the browser downloads
// each subset file on each page. These rules are the same as the ones that `next/font/google`
// writes: the browser downloads a subset file only when the page has a character from it.
const faces = FONT_FACES.map(face => ({ ...face, uri: Asset.fromModule(face.source).uri }));

const css = faces
  .map(
    face =>
      `@font-face{font-family:${JSON.stringify(face.family)};font-style:normal;` +
      `font-weight:${face.weight};font-display:swap;` +
      `src:url(${JSON.stringify(face.uri)}) format("woff2");unicode-range:${face.unicodeRange}}`
  )
  .join('');

/** Adds the web font rules, and a preload link for each Latin subset file, to the head. */
export function FontFaces() {
  return (
    <>
      {faces
        .filter(face => face.isPreloaded)
        .map(face => (
          <link
            key={face.uri}
            rel="preload"
            href={face.uri}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      <style href="docs-font-faces" precedence="default">
        {css}
      </style>
    </>
  );
}
