import * as React from 'react';
import * as Svg from 'react-native-svg';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'SVG';

const components = [
  'Circle',
  'ClipPath',
  'Defs',
  'Ellipse',
  'G',
  'Image',
  'Line',
  'LinearGradient',
  'Path',
  'Pattern',
  'Polygon',
  'Polyline',
  'RadialGradient',
  'Rect',
  'Stop',
  'Svg',
  'Symbol',
  'TSpan',
  'Text',
  'TextPath',
  'Use',
  'Mask',
];

export function test(t, { setPortalChild, cleanupPortal }) {
  const mountAndWaitFor = (child, propName = 'ref') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  t.describe(name, () => {
    t.afterEach(async () => await cleanupPortal());

    for (const component of components) {
      t.it(component, async () => {
        const SVGComponent = Svg[component];

        await mountAndWaitFor(
          <Svg.Svg key={`svg-${component}`}>
            <SVGComponent />
          </Svg.Svg>
        );
      });
    }
  });
}
