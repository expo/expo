import * as React from 'react';
import styled, { keyframes, css } from 'react-emotion';

import * as Constants from '~/common/constants';
import BulletIcon from '~/components/icons/Bullet';

const STYLES_TITLE = css`
  font-family: ${Constants.fonts.demi};
  font-weight: 400;
  line-height: 1.625rem;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  margin-top: 2rem;
`;

const STYLES_HORIZONTAL_ITEM = css`
  display: inline-block;
  position: relative;
  margin-bottom: 16px;
  margin-right: 24px;
  font-size: 1rem;
  line-height: 1.8rem;
`;

const STYLES_VERTICAL_ITEM = css`
  position: relative;
  margin-bottom: 16px;
  font-size: 1rem;
  line-height: 1.8rem;
`;

const STYLES_HORIZONTAL_BULLET = css`
  display: inline-block;
  position: relative;
  top: 4px;
  width: 20px;
  height: 20px;
`;

const STYLES_VERTICAL_BULLET = css`
  position: absolute;
  top: 4px;
  left: -20px;
  width: 20px;
  height: 20px;
`;

const STYLES_PROMPT = css`
  background-color: ${Constants.colors.black};
  border-radius: 8px;
  padding: 1.25em 2em;
`;

const STYLES_LINE = css`
  white-space: nowrap;
  color: ${Constants.colors.grey};
  ::before {
    content: '$ ';
    color: ${Constants.colors.expoLighter};
  }
`;

export default class TerminalBlock extends React.Component {
    render() {
        const { cmd } = this.props;
        return (
            <div className={STYLES_PROMPT}>
                {cmd.map(line => (
                    <code className={STYLES_LINE}>{line}</code>
                ))}
            </div>
        );
    }
}
