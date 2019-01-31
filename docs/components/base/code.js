import { css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

const attributes = {
  'data-text': true,
};

const STYLES_CODE_BLOCK = css`
  color: ${Constants.colors.black80};
  font-family: ${Constants.fontFamilies.mono};
  font-size: 13px;
  line-height: 20px;
  white-space: inherit;
  padding: 0px;
  margin: 0px;

  .code-annotation {
    transition: 200ms ease all;
    transition-property: text-shadow, opacity;
    text-shadow: 1px 1px ${Constants.colors.black30};
    /* Use a pseudo-element to not break copy-and-paste */
    ::after {
      content: '💬';
    }
  }

  .code-annotation:hover {
    cursor: pointer;
    animation: none;
    opacity: 0.8;
  }
`;

const STYLES_INLINE_CODE = css`
  color: ${Constants.colors.black80};
  font-family: ${Constants.fontFamilies.mono};
  font-size: 0.9rem;
  white-space: pre-wrap;
  display: inline;
  padding: 4px;
  margin: 2px;
  line-height: 20px;
  max-width: 100%;

  word-wrap: break-word;
  background-color: ${Constants.colors.blackRussian};
  vertical-align: middle;
  overflow-x: scroll;

  ::before {
    content: '';
  }

  ::after {
    content: '';
  }
`;

const STYLES_CODE_CONTAINER = css`
  border: 1px solid ${Constants.colors.border};
  padding: 24px;
  margin: 16px 0 16px 0;
  white-space: pre;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background-color: rgba(0, 1, 31, 0.03);
  line-height: 1.2rem;
`;

const recursiveMap = (children, fn) => {
  return React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    if (child.props.children) {
      child = React.cloneElement(child, {
        children: recursiveMap(child.props.children, fn),
      });
    }

    return fn(child);
  });
};

const tooltipMarker = '@tooltip';

const tooltipComment = ({ props }) =>
  props.name === 'span' &&
  props.props.className === 'token comment' &&
  typeof props.children[0] === 'string' &&
  props.children[0].includes(tooltipMarker);

const annotationContent = ({ props }) =>
  props.children[0]
    .replace('/*', '')
    .replace(tooltipMarker, '')
    .replace('*/', '')
    .replace('//', '');

const replaceCommentsWithAnnotations = thisArg => {
  if (!tooltipComment(thisArg)) return thisArg;
  return <span className="code-annotation" title={annotationContent(thisArg)} />;
};

export class Pre extends React.Component {
  componentDidMount() {
    this._runTippy();
  }

  componentDidUpdate() {
    this._runTippy();
  }

  _runTippy() {
    if (process.browser) {
      tippy('.code-annotation', {
        theme: 'expo',
        placement: 'top',
        arrow: true,
        arrowType: 'round',
        interactive: true,
        distance: 20,
      });
    }
  }

  render() {
    this.props.children.props.props.className += ' ' + STYLES_CODE_BLOCK;
    return (
      <pre
        className={this.props.className + ' ' + STYLES_CODE_CONTAINER}
        children={recursiveMap(this.props.children, replaceCommentsWithAnnotations)}
        {...attributes}
      />
    );
  }
}

export const InlineCode = ({ children }) => (
  <code className={`${STYLES_INLINE_CODE} inline`}>{children}</code>
);
