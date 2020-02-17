import * as React from 'react';
import { css } from 'react-emotion';

import ReactIcon from '../icons/React';
import TerminalBlock from './TerminalBlock';

import * as Constants from '~/common/constants';

const STYLES_REACT_ICON = css`
  width: 20px;
  height: 20px;
  margin-right: 4px;
  fill: ${Constants.colors.reactBlue};
`;
const STYLES_HEADER = css`
  margin-bottom: 1rem;
  margin-top: 2rem;
`;
const STYLES_P = css`
  line-height: 1.8rem;
  margin-bottom: 1.4rem;
`;

const STYLES_BOLD = css`
  font-family: ${Constants.fonts.demi};
  font-weight: 400;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`;
const STYLES_LINK = css`
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`;

export default function InstallSection({
  packageName,
  cmd = [`expo install ${packageName}`],
  href = `https://github.com/expo/expo/tree/master/packages/${packageName}`,
}) {
  return (
    <div>
      <TerminalBlock cmd={cmd} />
      <h2 className={STYLES_HEADER}>
        <ReactIcon className={STYLES_REACT_ICON} />
        Bare Workflow
      </h2>
      <p className={STYLES_P}>
        To use this in a{' '}
        <a className={STYLES_LINK} href="../../introduction/managed-vs-bare/#bare-workflow">
          bare React Native app
        </a>
        , follow the{' '}
        <a className={STYLES_BOLD} href={href}>
          installation instructions.
        </a>
      </p>
    </div>
  );
}
