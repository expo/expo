import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';

import PermalinkIcon from '~/components/icons/Permalink';

class Permalink extends React.Component {
  render() {
    const { component, className, children, ...rest } = this.props;
    return React.cloneElement(
      component,
      {
        className: [className, component.props.className || ''].join(' '),
        ...rest,
      },
      children
    );
  }
}

const STYLES_CONTAINER = css`
  position: relative;
  cursor: pointer;

  .anchor-icon {
    position: absolute;
    top: 2px;
    width: 20px;
    height: 20px;
    visibility: hidden;
  }

  :hover {
    .anchor-icon {
      visibility: visible;
    }
  }
`;

const STYLES_CONTAINER_ANCHOR = css`
  position: absolute;
  top: 0;
  left: -24px;
  width: 20px;
  height: 20px;
`;

const STYLES_CONTAINER_TARGET = css`
  display: block;
  position: absolute
  top: -100px;
  visibility: hidden;
`;

export default props => {
  // TODO(jim): Figure out what the reason is for this...
  const component = props.children;
  const children = component.props.children || '';
  let id = props.id;

  if (id == null) {
    id = Utilities.generateSlug(children);
  }

  return (
    <Permalink component={component} data-components-heading>
      <div className={STYLES_CONTAINER}>
        <span id={id} className={STYLES_CONTAINER_TARGET} />
        <a href={'#' + id} className={`permalink ${STYLES_CONTAINER_ANCHOR}`}>
          <PermalinkIcon />
        </a>
        <div className="permalink-child">{children}</div>
      </div>
    </Permalink>
  );
};
