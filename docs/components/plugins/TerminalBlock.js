import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_PROMPT = css`
  background-color: ${Constants.colors.black};
  border-radius: 4px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-x: scroll;
  margin-bottom: 1rem;
`;

const STYLES_LINE = css`
  white-space: nowrap;
  font-family: ${Constants.fontFamilies.mono};
  font-size: 13px;
  color: ${Constants.colors.codeWhite};
  line-height: 160%;
  ::before {
    content: '$ ';
    color: ${Constants.colors.lila};
  }
`;

const STYLES_COMMENT = css`
  user-select: none;
  white-space: nowrap;
  font-family: ${Constants.fontFamilies.mono};
  opacity: 0.6;
  font-size: 13px;
  color: ${Constants.colors.codeWhite};
  line-height: 150%;
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
