import { styled } from '@storybook/theming';
import { document, window } from 'global';
import { js as beautify } from 'js-beautify';
import memoize from 'memoizerific';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { ActionBar } from './ActionBar';
import theme from './theme';

const Wrapper = styled.div(
  {
    position: 'relative',
    overflow: 'hidden',
  },
  ({ bordered }) =>
    bordered
      ? {
          border: `1px solid ${theme.appBorderColor}`,
          borderRadius: theme.borderRadius,
          background: (theme.background || {}).bar,
        }
      : {}
);

const Scroller = styled.div(
  {
    position: 'relative',
    overflow: 'auto',
  },
  () => ({
    '& code': {
      paddingRight: theme.layoutMargin,
    },
  })
  // ({}) => themedSyntax(theme)
);

const atomOneLight = {
  hljs: {
    display: 'block',
    overflowX: 'auto',
    padding: '1em',
    margin: 0,
    paddingBottom: '3em',
    color: '#383a42',
    background: 'rgba(0,0,0,0)',
  },
  'hljs-comment': {
    color: '#a0a1a7',
    fontStyle: 'italic',
  },
  'hljs-quote': {
    color: '#a0a1a7',
    fontStyle: 'italic',
  },
  'hljs-doctag': {
    color: '#a626a4',
  },
  'hljs-keyword': {
    color: '#a626a4',
  },
  'hljs-formula': {
    color: '#a626a4',
  },
  'hljs-section': {
    color: '#e45649',
  },
  'hljs-name': {
    color: '#e45649',
  },
  'hljs-selector-tag': {
    color: '#e45649',
  },
  'hljs-deletion': {
    color: '#e45649',
  },
  'hljs-subst': {
    color: '#e45649',
  },
  'hljs-literal': {
    color: '#0184bb',
  },
  'hljs-string': {
    color: '#50a14f',
  },
  'hljs-regexp': {
    color: '#50a14f',
  },
  'hljs-addition': {
    color: '#50a14f',
  },
  'hljs-attribute': {
    color: '#50a14f',
  },
  'hljs-meta-string': {
    color: '#50a14f',
  },
  'hljs-built_in': {
    color: '#c18401',
  },
  'hljs-class .hljs-title': {
    color: '#c18401',
  },
  'hljs-attr': {
    color: '#986801',
  },
  'hljs-variable': {
    color: '#986801',
  },
  'hljs-template-variable': {
    color: '#986801',
  },
  'hljs-type': {
    color: '#986801',
  },
  'hljs-selector-class': {
    color: '#986801',
  },
  'hljs-selector-attr': {
    color: '#986801',
  },
  'hljs-selector-pseudo': {
    color: '#986801',
  },
  'hljs-number': {
    color: '#986801',
  },
  'hljs-symbol': {
    color: '#4078f2',
  },
  'hljs-bullet': {
    color: '#4078f2',
  },
  'hljs-link': {
    color: '#4078f2',
    textDecoration: 'underline',
  },
  'hljs-meta': {
    color: '#4078f2',
  },
  'hljs-selector-id': {
    color: '#4078f2',
  },
  'hljs-title': {
    color: '#4078f2',
  },
  'hljs-emphasis': {
    fontStyle: 'italic',
  },
  'hljs-strong': {
    fontWeight: 'bold',
  },
};

export default class CopyableCode extends Component {
  static propTypes = {
    language: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    copyable: PropTypes.bool,
    bordered: PropTypes.bool,
    format: PropTypes.bool,
    className: PropTypes.string,
  };

  componentWillUnmount() {
    window.clearTimeout(this.timeout);
  }

  static defaultProps = {
    language: 'jsx',
    copyable: false,
    bordered: false,
    format: true,
    className: null,
  };

  state = { copied: false };

  formatCode = memoize(2)((language, code) => {
    let formattedCode = code;
    if (language === 'jsx') {
      try {
        formattedCode = beautify(code, {
          indent_size: 2,
          brace_style: 'collapse,preserve-inline',
          end_with_newline: true,
          wrap_line_length: 80,
          e4x: true,
        });
      } catch (error) {
        console.warn("Couldn't format code", formattedCode); // eslint-disable-line no-console
      }
    }
    return formattedCode;
  });

  onClick = e => {
    const { children } = this.props;

    e.preventDefault();
    const tmp = document.createElement('TEXTAREA');
    const focus = document.activeElement;

    tmp.value = children;

    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    focus.focus();

    this.setState({ copied: true }, () => {
      this.timeout = window.setTimeout(() => this.setState({ copied: false }), 1500);
    });
  };

  render() {
    const { children, language, copyable, bordered, format, className } = this.props;

    const { copied } = this.state;

    return children ? (
      <Wrapper bordered={bordered} className={className}>
        <Scroller>
          <SyntaxHighlighter style={atomOneLight} language={language} lineNumberContainerStyle={{}}>
            {format ? this.formatCode(language, children.trim()) : children.trim()}
          </SyntaxHighlighter>
        </Scroller>
        {copyable ? (
          <ActionBar actionItems={[{ title: copied ? 'Copied' : 'Copy', onClick: this.onClick }]} />
        ) : null}
      </Wrapper>
    ) : null;
  }
}
