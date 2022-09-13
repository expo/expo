import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import * as React from 'react';

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
  margin: 20px 0;

  .code-block-column {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-right: -1px;
    min-width: 0;

    pre {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    &:not(:first-of-type) pre {
      border-bottom-left-radius: 0;
    }
    &:not(:last-child) pre {
      border-bottom-right-radius: 0;
    }
    &:first-of-type .code-block-header {
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
      ${typography.fontSizes[15]}
      color: ${theme.text.default};
      font-family: ${typography.fontFaces.mono};
    }
  }
  .code-block-content {
    flex: 1;
    overflow-x: auto;

    pre {
      height: 100%;
      margin: 0;

      ::-webkit-scrollbar {
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: ${theme.background.secondary};
      }
      ::-webkit-scrollbar-thumb {
        background: ${theme.background.tertiary};
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${theme.background.quaternary};
      }
    }
  }
`;

type Props = {
  children: JSX.Element[];
  tabs?: string[];
};

export function CodeBlocksTable({ children, tabs, ...rest }: Props) {
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
    <div css={CodeSamplesCSS} {...rest}>
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
