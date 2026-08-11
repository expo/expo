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
import React, { type ReactElement } from 'react';
import { View, Text } from 'react-native';

import type { JasmineInterface, TestPortal } from '../types';
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
  LI,
  Q,
  Time,
  BR,
};

const viewElements = {
  Article,
  Header,
  Main,
  Section,
  Nav,
  Footer,
  UL,
  LI,
  BlockQuote,
  Pre,
};

export async function test(
  { it, describe, afterEach }: JasmineInterface,
  { setPortalChild, cleanupPortal }: TestPortal
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  const mountAndWaitFor = (child: ReactElement<any>, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    describe('Text', () => {
      for (const [elementName, Element] of Object.entries(textElements)) {
        it(`renders text element ${elementName}`, async () => {
          await mountAndWaitFor(<Element>Test contents</Element>);
        });
      }
    });
    describe('Views', () => {
      for (const [elementName, Element] of Object.entries(viewElements)) {
        it(`renders view elements ${elementName}`, async () => {
          await mountAndWaitFor(
            <Element>
              <Text>Hello</Text>
            </Element>
          );
        });
      }
    });

    it(`renders a horizontal rule`, async () => {
      await mountAndWaitFor(
        <View>
          <HR />
        </View>
      );
    });
    it(`renders a table`, async () => {
      await mountAndWaitFor(
        <Table>
          <Caption>Caption</Caption>
          <THead>
            <TR>
              <TH colSpan={2}>The table header</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>The table body</TD>
              <TD>with two columns</TD>
            </TR>
            <TR>
              <TD>Row two</TD>
              <TD>Column two</TD>
            </TR>
          </TBody>
          <TFoot>
            <TR>
              <TH colSpan={2}>The table footer</TH>
            </TR>
          </TFoot>
        </Table>
      );
    });
    it(`renders a table`, async () => {
      await mountAndWaitFor(
        <Table>
          <Caption>Caption</Caption>
          <THead>
            <TR>
              <TH colSpan={2}>The table header</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD>The table body</TD>
              <TD>with two columns</TD>
            </TR>
            <TR>
              <TD>Row two</TD>
              <TD>Column two</TD>
            </TR>
          </TBody>
          <TFoot>
            <TR>
              <TH colSpan={2}>The table footer</TH>
            </TR>
          </TFoot>
        </Table>
      );
    });
  });
}
