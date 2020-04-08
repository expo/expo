import {
  A,
  Article,
  B,
  BlockQuote,
  BR,
  Caption,
  Code,
  Del,
  EM,
  Footer,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  HR,
  I,
  LI,
  Main,
  Mark,
  Nav,
  P,
  Pre,
  Q,
  S,
  Section,
  Strong,
  Table,
  TBody,
  TD,
  TFoot,
  TH,
  THead,
  Time,
  TR,
  UL,
} from '@expo/html-elements';
import React from 'react';
import { View } from 'react-native';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'html-elements';

const textElements = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  A,
  P,
  B,
  S,
  Pre,
  Del,
  Strong,
  I,
  EM,
  Mark,
  Code,
  TH,
  TD,
  Caption,
  LI,
  Q,
  Time,
};

const viewElements = {
  Article,
  Header,
  Main,
  Section,
  Nav,
  BR,
  HR,
  Footer,
  Table,
  THead,
  TBody,
  TFoot,
  TR,
  UL,
  LI,
  BlockQuote,
  Pre,
};

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  const mountAndWaitFor = (child, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    describe('Text', () => {
      for (const elementName of Object.keys(textElements)) {
        it(`renders text element ${elementName}`, async () => {
          const Element = textElements[elementName];
          await mountAndWaitFor(<Element>Test contents</Element>);
        });
      }
    });
    describe('Views', () => {
      for (const elementName of Object.keys(viewElements)) {
        it(`renders view elements ${elementName}`, async () => {
          const Element = viewElements[elementName];
          await mountAndWaitFor(
            <Element>
              <View />
            </Element>
          );
        });
      }
    });
  });
}
