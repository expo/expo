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

function getEmoji(isSupported) {
  return isSupported ? '✅' : '❌';
}

export default class PlatformsSection extends React.Component {
  render() {
    const { ios, android, web, simulator, emulator } = this.props;
    return (
      <div>
        <h4 data-heading="true" className={STYLES_TITLE}>
          Platform Compatibility
        </h4>
        <table>
          <thead>
            <tr>
              <th>Android Device</th>
              <th>Android Emulator</th>
              <th>iOS Device</th>
              <th>iOS Simulator</th>
              <th>Web</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {[android, emulator, ios, simulator, web].map((platform, index) => (
                <td key={`-${index}`} className={STYLES_CELL}>
                  {getEmoji(platform)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
