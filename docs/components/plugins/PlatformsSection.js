import { css } from '@emotion/core';
import * as React from 'react';

import * as Constants from '~/constants/theme';
import { CheckCircle } from '~/components/icons/CheckCircle';
import { XCircle } from '~/components/icons/XCircle';
import { PendingCircle } from '~/components/icons/PendingCircle';
import { H4 } from '~/components/base/headings';

const STYLES_TITLE = css`
  margin-bottom: 1rem;
`;

const STYLES_CELL = css`
  transition-duration: 0.2s;
  :hover {
    background-color: ${Constants.colors.grey};
  }
`;

const STYLES_LINK = css`
  text-decoration: none;
  display: grid;
  grid-template-columns: 20px auto;
  text-align: left;
  grid-gap: 8px;
`;

function getInfo(isSupported, { title }) {
  if (isSupported === true) {
    return {
      children: <CheckCircle size={20} />,
      title: `${title} is supported`,
    };
  } else if (typeof isSupported === 'object') {
    return {
      children: (
        <a css={STYLES_LINK} target="_blank" href={isSupported.pending}>
          <PendingCircle size={20} /> Pending
        </a>
      ),
      title: `${title} support is pending`,
    };
  }

  return {
    children: <XCircle size={20} />,
    title: `${title} is not supported`,
  };
}

const platforms = [
  { title: 'Android Device', propName: 'android' },
  { title: 'Android Emulator', propName: 'emulator' },
  { title: 'iOS Device', propName: 'ios' },
  { title: 'iOS Simulator', propName: 'simulator' },
  { title: 'Web', propName: 'web' },
];

// type Props = { title?: string; ios: boolean; android: boolean; web: boolean; simulator: boolean; emulator: boolean; };

export default class PlatformsSection extends React.Component {
  render() {
    return (
      <div>
        <H4 css={STYLES_TITLE}>{this.props.title || 'Platform Compatibility'}</H4>
        <table>
          <thead>
            <tr>
              {platforms.map(({ title }) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {platforms.map(platform => (
                <td
                  key={platform.title}
                  css={STYLES_CELL}
                  {...getInfo(this.props[platform.propName], platform)}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
