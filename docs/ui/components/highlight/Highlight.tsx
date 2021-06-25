import { css } from '@emotion/react';
import PrismHighlight, { defaultProps, Language, PrismTheme } from 'prism-react-renderer';
import React from 'react';

import { expoTheme } from './themes/expo';
import { installLanguages } from './utils';

import { PRE } from '~/ui/components/Text';

installLanguages();

type HighlightProps = {
  children: string;
  language?: Language;
  theme?: PrismTheme;
  withLineNumbers?: boolean;
  withLastLine?: boolean;
};

export const Highlight = (props: HighlightProps) => {
  const {
    children,
    theme,
    language = 'javascript',
    withLineNumbers = false,
    withLastLine = false,
  } = props;

  return (
    <PrismHighlight
      {...defaultProps}
      theme={theme || expoTheme}
      code={withLastLine ? children : children.trim()}
      language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <PRE css={preStyle} className={className} style={style}>
          {tokens.map((line, i) => (
            <div css={lineStyle} {...getLineProps({ line, key: i })}>
              {withLineNumbers && <span css={lineNumberStyle}>{i + 1}</span>}
              <span css={lineContentStyle}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </span>
            </div>
          ))}
        </PRE>
      )}
    </PrismHighlight>
  );
};

const preStyle = css`
  border: none;
  margin: 0;
  padding: 0;
`;

const lineStyle = css`
  display: table-row;
`;

const lineNumberStyle = css`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.5;
`;

const lineContentStyle = css`
  display: table-cell;
`;
