import { css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import PermalinkIcon from '~/components/icons/Permalink';
import withSlugger from '~/components/page-higher-order/withSlugger';

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

  .anchor-icon {
    cursor: pointer;
    position: absolute;
    top: 8px;
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

const PermalinkWithSlugger = withSlugger(props => {
  // NOTE(jim): Not the greatest way to generate permalinks.
  // for now I've shortened the length of permalinks.
  const component = props.children;
  const children = component.props.children || '';

  let permalinkKey = props.id;

  if (!permalinkKey) {
    permalinkKey = Utilities.generateSlug(props.slugger, children);
  }

  return (
    <Permalink component={component} data-components-heading>
      <div className={STYLES_CONTAINER}>
        <span id={permalinkKey} className={STYLES_CONTAINER_TARGET} />
        <a
          style={props.customIconStyle}
          href={'#' + permalinkKey}
          className={`permalink ${STYLES_CONTAINER_ANCHOR}`}>
          <PermalinkIcon />
        </a>
        <div className="permalink-child">{children}</div>
      </div>
    </Permalink>
  );
});

export default PermalinkWithSlugger;
