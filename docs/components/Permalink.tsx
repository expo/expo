import { css } from '@emotion/core';
import * as React from 'react';

import * as Utilities from '~/common/utilities';
import PermalinkIcon from '~/components/icons/Permalink';
import withHeadingManager from '~/components/page-higher-order/withHeadingManager';

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
  position: absolute;
  top: -100px;
  visibility: hidden;
`;

/**
 * Props:
 * - children: Title or component containing title text
 * - nestingLevel: Sidebar heading level override
 * - additionalProps: Additional properties passed to component
 */
export default withHeadingManager(props => {
  // NOTE(jim): Not the greatest way to generate permalinks.
  // for now I've shortened the length of permalinks.
  const component = props.children;
  const children = component.props.children || '';

  let permalinkKey = props.id;

  const heading = props.headingManager.addHeading(
    children,
    props.nestingLevel,
    props.additionalProps
  );

  if (!permalinkKey) {
    permalinkKey = heading.slug;
  }

  return (
    <Permalink component={component} data-components-heading>
      <div css={STYLES_CONTAINER} ref={heading.ref}>
        <span id={permalinkKey} css={STYLES_CONTAINER_TARGET} />
        <a
          style={props.customIconStyle}
          href={'#' + permalinkKey}
          className='permalink'
          css={STYLES_CONTAINER_ANCHOR}>
          <PermalinkIcon />
        </a>
        <div className="permalink-child">{children}</div>
      </div>
    </Permalink>
  );
});
