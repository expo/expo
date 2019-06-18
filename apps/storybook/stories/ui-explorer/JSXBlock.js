import Markdown from 'markdown-to-jsx';
import * as React from 'react';

import SyntaxHighlighterBase from './SyntaxHighlighter';

export const SyntaxHighlighter = props => {
  // markdown-to-jsx does not add className to inline code
  //   if (props.className === undefined) {
  //     return <code>{props.children}</code>;
  //   }
  // className: "lang-jsx"
  const language = (props.className || 'lang-jsx').split('-');
  return (
    <SyntaxHighlighterBase language={language[1]} bordered copyable {...props} />
  );
};

const defaultOptions = {
  overrides: {
    code: SyntaxHighlighter,
  },
};

const inBlock = code => {
  return '```jsx\n' + code + '\n```';
};

export default class NotesPanel extends React.Component {
  render() {
    const { children } = this.props;
    return <Markdown options={defaultOptions}>{inBlock(children)}</Markdown>;
  }
}
