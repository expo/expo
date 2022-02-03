import { css } from '@emotion/react';
import { palette, typography } from '@expo/styleguide';
import * as React from 'react';

const STYLES_PROMPT = css`
  background-color: ${palette.light.black};
  border-radius: 4px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  margin-bottom: 1rem;
`;

const STYLES_LINE = css`
  white-space: nowrap;
  font-family: ${typography.fontFaces.mono};
  font-size: 13px;
  color: ${palette.dark.gray[900]};
  line-height: 160%;
  ::before {
    content: '$ ';
    color: ${palette.dark.primary[700]};
  }
`;

const STYLES_COMMENT = css`
  user-select: none;
  white-space: nowrap;
  font-family: ${typography.fontFaces.mono};
  font-size: 13px;
  color: ${palette.dark.gray[600]};
  line-height: 150%;
`;

export const ShellComment: React.FC = ({ children }) => {
  return (
    <code unselectable="on" css={STYLES_COMMENT}>
      {children}
    </code>
  );
};

const TerminalBlock: React.FC<{ cmd: string[] }> = ({ cmd }) => {
  return (
    <div css={STYLES_PROMPT}>
      {cmd.map((line, index) => {
        const key = `line-${index}`;
        if (line.startsWith('#')) {
          return <ShellComment key={key}>{line}</ShellComment>;
        } else if (line.trim() === '') {
          return <br key={key} />;
        }
        return (
          <code key={key} css={STYLES_LINE}>
            {line}
          </code>
        );
      })}
    </div>
  );
};

export default TerminalBlock;
