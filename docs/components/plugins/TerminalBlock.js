import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_PROMPT = css`
  background-color: ${Constants.colors.black};
  border-radius: 6px;
  padding: 1.25em 2em;
`;

const STYLES_LINE = css`
  white-space: nowrap;
  color: ${Constants.colors.codeWhite};
  ::before {
    content: '$ ';
    color: ${Constants.colors.lila};
  }
`;

export default function TerminalBlock({ cmd }) {
  return (
    <div className={STYLES_PROMPT}>
      {cmd.map(line => (
        <code className={STYLES_LINE}>{line}</code>
      ))}
    </div>
  );
}
