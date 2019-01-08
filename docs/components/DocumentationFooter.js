import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

import { H2, H3, H4 } from '~/components/base/headings';
import { PDIV, P, Quote } from '~/components/base/paragraph';

const STYLES_FOOTER = css`
  border-top: 1px solid ${Constants.colors.border};
  padding: 24px 0 24px 0;
`;

const STYLES_FOOTER_LINK = css`
  display: block;
  text-decoration: none;
  margin-bottom: 12px;
`;

export default class DocumentationFooter extends React.PureComponent {
  render() {
    return (
      <footer className={STYLES_FOOTER}>
        <P>Want to contribute? Still need help?</P>
        <a className={STYLES_FOOTER_LINK} target="_blank" href="https://forums.expo.io/">
          Ask on our forums
        </a>
        <a
          className={STYLES_FOOTER_LINK}
          target="_blank"
          href={'https://github.com/expo/expo-docs/'}>
          Send us a pull request
        </a>
      </footer>
    );
  }
}
