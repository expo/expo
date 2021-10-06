import { css } from '@emotion/react';
import * as React from 'react';

import { AdditionalProps } from '~/common/headingManager';
import PermalinkIcon from '~/components/icons/Permalink';
import withHeadingManager from '~/components/page-higher-order/withHeadingManager';

type BaseProps = {
  component: any;
  className?: string;
};

type EnhancedProps = {
  children: React.ReactNode;
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  customIconStyle?: React.CSSProperties;
  id?: string;
};

const STYLES_PERMALINK = css`
  position: relative;
`;

const STYLES_PERMALINK_TARGET = css`
  display: block;
  position: absolute;
  top: -100px;
  visibility: hidden;
`;

const STYLES_PERMALINK_LINK = css`
  color: inherit;
  text-decoration: inherit;

  /* Disable link when used in collapsible, to allow expand on click */
  details & {
    pointer-events: none;
  }
`;

const STYLED_PERMALINK_CONTENT = css`
  display: inline;
`;

const STYLES_PERMALINK_ICON = css`
  cursor: pointer;
  vertical-align: text-top;
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  padding: 0 0.2em;
  visibility: hidden;

  a:hover & {
    visibility: visible;
  }

  svg {
    width: 100%;
    height: auto;
  }
`;

const PermalinkBase: React.FC<BaseProps> = ({ component, children, className, ...rest }) =>
  React.cloneElement(
    component,
    {
      className: [className, component.props.className || ''].join(' '),
      ...rest,
    },
    children
  );

/**
 * Props:
 * - children: Title or component containing title text
 * - nestingLevel: Sidebar heading level override
 * - additionalProps: Additional properties passed to component
 */
const Permalink: React.FC<EnhancedProps> = withHeadingManager(props => {
  // NOTE(jim): Not the greatest way to generate permalinks.
  // for now I've shortened the length of permalinks.
  const component = props.children as JSX.Element;
  const children = component.props.children || '';

  let permalinkKey = props.id;
  let heading;

  if (props.nestingLevel) {
    heading = props.headingManager.addHeading(
      children,
      props.nestingLevel,
      props.additionalProps,
      permalinkKey
    );
  }

  if (!permalinkKey && heading?.slug) {
    permalinkKey = heading.slug;
  }

  return (
    <PermalinkBase component={component} data-components-heading>
      <div css={STYLES_PERMALINK} ref={heading?.ref}>
        <span css={STYLES_PERMALINK_TARGET} id={permalinkKey} />
        <a css={STYLES_PERMALINK_LINK} href={'#' + permalinkKey}>
          <span css={STYLED_PERMALINK_CONTENT}>{children}</span>
          <span css={STYLES_PERMALINK_ICON} style={props.customIconStyle}>
            <PermalinkIcon />
          </span>
        </a>
      </div>
    </PermalinkBase>
  );
});

export default Permalink;
