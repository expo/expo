import { css } from '@emotion/core';
import * as React from 'react';

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

const VersionSelector = ({ version, style, onSetVersion }) => (
  <div css={STYLES_SELECT} style={style}>
    <label css={STYLES_SELECT_TEXT} htmlFor="version-menu">
      <div>{Utilities.getUserFacingVersionString(version, LATEST_VERSION)}</div>
      <ChevronDownIcon style={{ height: '16px', width: '16px' }} />
    </label>
    {// hidden links to help test-links spidering
    VERSIONS.map(v => (
      <a key={v} style={{ display: 'none' }} href={`/versions/${v}/`} />
    ))}
    <select
      id="version-menu"
      css={STYLES_SELECT_ELEMENT}
      value={version}
      onChange={e => onSetVersion(e.target.value)}>
      {VERSIONS.map(v => (
        <option key={v} value={v}>
          {Utilities.getUserFacingVersionString(v, LATEST_VERSION)}
        </option>
      ))}
    </select>
  </div>
);

export default VersionSelector;
