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
  margin-left: -20px;
  display: flex;
  flex-direction: row;

  :hover > .permalink {
    visibility: visible;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    margin-left: 0px;
  }
`;

const STYLES_CONTAINER_ANCHOR = css`
  color: inherit;
  margin-right: 5px;
  text-decoration: none;
  text-align: center;
  vertical-align: middle;
  visibility: hidden;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    margin-left: -20px;
    padding-left: 5px;
  }
`;

const STYLES_CONTAINER_TARGET = css`
  display: block;
  margin-top: -100px;
  visibility: hidden;
`;

export default props => {
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
        <div style={{ lineHeight: '1.5em' }}>{children}</div>
      </div>
    </Permalink>
  );
};
