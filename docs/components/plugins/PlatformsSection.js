import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_TITLE = css`
  font-family: ${Constants.fonts.demi};
  font-weight: 400;
  line-height: 1.625rem;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const STYLES_CELL = css`
  transition-duration: 0.2s;
  text-align: center;
  :hover {
    background-color: ${Constants.colors.grey};
  }
`;

const STYLES_LINK = css`
  text-decoration: none;
`;

function getInfo(isSupported, { title }) {
  if (isSupported === true) {
    return {
      children: '✅',
      title: `${title} is supported`,
    };
  } else if (typeof isSupported === 'object') {
    return {
      children: (
        <a className={STYLES_LINK} target="_blank" href={isSupported.pending}>
          ⏱ Pending
        </a>
      ),
      title: `${title} support is pending`,
    };
  }
  return {
    children: '❌',
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
        <h4 data-heading="true" className={STYLES_TITLE}>
          {this.props.title || 'Platform Compatibility'}
        </h4>
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
                  className={STYLES_CELL}
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
