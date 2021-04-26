import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';
import { NavigationRoute, Url } from '~/types/common';

const STYLES_TITLE = css`
  ${paragraph}
  font-size: 15px;
  display: block;
  position: relative;
  margin-bottom: 12px;
  text-decoration: none;
  font-family: ${Constants.fontFamilies.demi};
  border-bottom: 1px solid ${theme.border.default};
  padding-bottom: 0.25rem;
`;

type Props = {
  url?: Url;
  info: NavigationRoute;
  asPath: string;
};

export default class DocumentationSidebarTitle extends React.Component<Props, any> {
  render() {
    return <div css={STYLES_TITLE}>{this.props.children}</div>;
  }
}
