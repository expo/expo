import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import * as Constants from '~/constants/theme';

const MDX_CLASS_NAME_TO_TAB_NAME: Record<string, string> = {
  'language-swift': 'Swift',
  'language-kotlin': 'Kotlin',
  'language-javascript': 'JavaScript',
  'language-typescript': 'TypeScript',
  'language-json': 'JSON',
  'language-ruby': 'Ruby',
  'language-groovy': 'Gradle',
};

const CodeSamplesCSS = css`
  display: flex;
  flex-direction: row;
  max-width: 100%;
  margin: 20px 0px;

  .code-block-column {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-right: -1px;
    min-width: 0px;

    pre {
      border-top-left-radius: 0px;
      border-top-right-radius: 0px;
    }
    &:not(:first-child) pre {
      border-bottom-left-radius: 0px;
    }
    &:not(:last-child) pre {
      border-bottom-right-radius: 0px;
    }
    &:first-child .code-block-header {
      border-top-left-radius: 4px;
    }
    &:last-child .code-block-header {
      border-top-right-radius: 4px;
    }
  }
  .code-block-header {
    padding: 6px 16px;
    background-color: ${theme.background.secondary};
    border: 1px solid ${theme.border.default};
    border-bottom-width: 0px;

    span {
      color: ${theme.text.default};
      font-family: ${Constants.fonts.mono};
      font-size: 15px;
    }
  }
  .code-block-content {
    flex: 1;
    overflow-x: scroll;

    pre {
      height: 100%;
      margin: 0px;
    }
  }
`;

type Props = {
  children: JSX.Element[];
  tabs?: string[];
};

export function CodeBlocksTable({ children, tabs }: Props) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const codeBlocks = childrenArray.filter(
    ({ props }) => props.mdxType === 'pre' && props.children.props.className
  );
  const tabNames =
    tabs ||
    codeBlocks.map(child => {
      const className = child.props.children.props.className;
      return MDX_CLASS_NAME_TO_TAB_NAME[className] || className.replace('language-', '');
    });

  return (
    <div css={CodeSamplesCSS}>
      {codeBlocks.map((codeBlock, index) => (
        <div key={index} className="code-block-column">
          <div className="code-block-header">
            <span>{tabNames[index]}</span>
          </div>
          <div className="code-block-content">{codeBlock}</div>
        </div>
      ))}
    </div>
  );
}
