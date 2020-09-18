import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/constants/theme';
import * as Utilities from '~/common/utilities';
import { VERSIONS, LATEST_VERSION } from '~/constants/versions';
import ChevronDownIcon from '~/components/icons/ChevronDown';
import { paragraph } from '~/components/base/typography';

const STYLES_SELECT = css`
  position: relative;
  margin: 0;
  padding: 8px 16px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  margin-bottom: 15px;
  width: 100%;
  background-color: ${Constants.expoColors.white};
  border: 1px solid ${Constants.expoColors.gray[250]};
  box-shadow: 0 2px 2px 0 rgba(0, 0, 20, 0.015), 0 0 0 1px rgba(0, 0, 20, 0.0075);

  :hover {
    background-color: ${Constants.expoColors.gray[100]};
  }
`;

const STYLES_SELECT_TEXT = css`
  ${paragraph}
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: space-between;
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.black};
  font-size: 14px;
`;

const STYLES_SELECT_ELEMENT = css`
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  width: 100%;
  border-radius: 0px;
  cursor: pointer;
`;

const versionNumber = vString => {
  const pattern = /v([0-9]+)\./,
    match = vString.match(pattern),
    number = parseInt(match[1], 10);
  return number;
};

const orderVersions = versions => {
  return versions.sort((a, b) => {
    switch (a) {
      case 'unversioned':
        return 1;
      case 'latest':
        if (b == 'unversioned') {
          return -1;
        } else {
          return 1;
        }
      default:
        switch (b) {
          case 'unversioned':
          case 'latest':
            return 1;
          default:
            return versionNumber(a) - versionNumber(b);
        }
    }
  });
};

export default class VersionSelector extends React.Component {
  render() {
    const latestLabel = 'Latest (' + Utilities.getUserFacingVersionString(LATEST_VERSION) + ')';
    const labelText =
      this.props.version === 'latest'
        ? latestLabel
        : Utilities.getUserFacingVersionString(this.props.version);

    return (
      <div className={STYLES_SELECT} style={this.props.style}>
        <label className={STYLES_SELECT_TEXT} htmlFor="version-menu">
          <div>{labelText}</div>
          <ChevronDownIcon style={{ height: '16px', width: '16px' }} />
        </label>
        {// hidden links to help test-links spidering
        orderVersions(VERSIONS).map(v => (
          <a key={v} style={{ display: 'none' }} href={`/versions/${v}/`} />
        ))}
        <select
          className={STYLES_SELECT_ELEMENT}
          id="version-menu"
          value={this.props.version}
          onChange={e => this.props.onSetVersion(e.target.value)}>
          {orderVersions(VERSIONS)
            .map(version => {
              return (
                <option key={version} value={version}>
                  {version === 'latest'
                    ? latestLabel
                    : Utilities.getUserFacingVersionString(version)}
                </option>
              );
            })
            .reverse()}
        </select>
      </div>
    );
  }
}
