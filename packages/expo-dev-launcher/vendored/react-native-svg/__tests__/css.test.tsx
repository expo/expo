import React from 'react';
import renderer from 'react-test-renderer';
import { SvgCss, parse, inlineStyles } from '../src/ReactNativeSVG';

const xml = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
     width="100%" height="100%" viewBox="0 0 1000 500">
  <defs>
    <style type="text/css">
      /* tag selector */
      rect {
        stroke: blue;
        fill: yellow
      }

      /* class selector */
      .redbox { fill: red; }

      /* multiple selectors */
      g .class-1, g .class-2 {
        stroke-width: 16
      }

      /* two classes */
      .class-2.transparent {
        fill-opacity: 0.3;
      }

      /* Commented out
      rect {
        fill: black;
      }
      */
    </style>
  </defs>
  <g>
    <rect class="redbox class-1" x="100" y="0" width="1000" height="200" />
  </g>
  <g>
    <rect class="redbox class-2 transparent" x="100" y="350" width="750" height="200" />
  </g>
</svg>`;

test('inlines styles', () => {
  const ast = parse(xml, inlineStyles);
  expect(ast).toMatchSnapshot();
});

test('supports CSS in style element', () => {
  const tree = renderer.create(<SvgCss xml={xml} />).toJSON();
  expect(tree).toMatchSnapshot();
});
