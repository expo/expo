import Markdown from 'markdown-to-jsx';
import * as React from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import Code from './Code';
import SyntaxHighlighter from './SyntaxHighlighter';

export const CodeElement = props => {
  if (props.className === undefined) {
    return <Code>{props.children}</Code>;
  }
  // className: "lang-jsx"
  const language = props.className.split('-')[1];
  return (
    <SyntaxHighlighter language={language} bordered copyable {...props} />
  );
};

const withHeader = level => ({ style, ...props }) => (
  <Text
    {...props}
    style={[styles.heading, styles[`h${level}`], style]}
    accessibilityRole="heading"
    aria-level={level}
  />
);

const defaultOptions = {
  overrides: {
    h1: {
      component: withHeader('1'),
    },
    h2: {
      component: withHeader('2'),
    },
    h3: {
      component: withHeader('3'),
    },
    h4: {
      component: withHeader('4'),
    },
    h5: {
      component: withHeader('5'),
    },
    h6: {
      component: withHeader('6'),
    },
    p: {
      component: ({ style, ...props }) => <Text {...props} style={[styles.p, style]} />,
    },
    a: {
      component: ({ style, ...props }) => (
        <Text {...props} style={[styles.a, style]} accessibilityRole="link" />
      ),
    },
    img: {
      component: ({ style, ...props }) => <Image {...props} style={[styles.img, style]} />,
    },
    code: CodeElement,
  },
};

export default class NotesPanel extends React.PureComponent {
  render() {
    return <Markdown {...this.props} options={defaultOptions} />
  }
}


const styles = StyleSheet.create({
  heading: {
    display: 'block',
    marginBottom: 10,
  },
  a: {
    display: 'inline-block',
    cursor: 'pointer',
    color: '#6430EB',
  },
  p: {
    display: 'block',
    marginVertical: 15,
    fontSize: 14,
  },
  img: {
    display: 'block',
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    lineHeight: 38.4,
    fontWeight: '400',
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
  },
  h3: {
    fontSize: 20,
    fontWeight: '400',
  },
  h4: {
    fontSize: 16,
    fontWeight: '400',
  },
  h5: {
    fontSize: 14,
    fontWeight: '400',
  },
  h6: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
});
