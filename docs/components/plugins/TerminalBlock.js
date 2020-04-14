import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_PROMPT = css`
  background-color: ${Constants.colors.black};
  border-radius: 6px;
  padding: 1.25em 2em;
  display: flex;
  flex-direction: column;
`;

const STYLES_LINE = css`
  white-space: nowrap;
  color: ${Constants.colors.codeWhite};
  ::before {
    content: '$ ';
    color: ${Constants.colors.lila};
  }
`;

const STYLES_COMMENT = css`
  user-select: none;
  white-space: nowrap;
  opacity: 0.4;
  color: ${Constants.colors.codeWhite};
`;

export function ShellComment({ children }) {
  return (
    <code unselectable="on" className={STYLES_COMMENT}>
      {children}
    </code>
  );
}

export default function TerminalBlock({ cmd }) {
  return (
    <div className={STYLES_PROMPT}>
      {cmd.map((line, index) => {
        const key = `line-${index}`;
        if (line.startsWith('#')) {
          return <ShellComment key={key}>{line}</ShellComment>;
        } else if (line.trim() === '') {
          return <br key={key} />;
        }
        return (
          <code key={key} className={STYLES_LINE}>
            {line}
          </code>
        );
      })}
    </div>
  );
}
