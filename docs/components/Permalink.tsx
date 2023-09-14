import { css } from '@emotion/react';
import { LinkBase } from '@expo/styleguide';
import * as React from 'react';
import tippy, { roundArrow } from 'tippy.js';

import { AdditionalProps } from '~/common/headingManager';
import PermalinkIcon from '~/components/icons/Permalink';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';

type BaseProps = React.PropsWithChildren<{
  component: any;
  className?: string;
  style?: React.CSSProperties;
}>;

type EnhancedProps = React.PropsWithChildren<{
  // Sidebar heading level override
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  id?: string;
}>;

const STYLES_PERMALINK_TARGET = css`
  display: block;
  position: absolute;
  top: -46px;
  visibility: hidden;
`;

const STYLES_PERMALINK_LINK = css`
  position: relative;
  color: inherit;
  text-decoration: none !important;

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
  vertical-align: middle;
  display: inline-block;
  width: 1.2em;
  height: 1em;
  padding: 0 0.2em;
  visibility: hidden;

  a:hover &,
  a:focus-visible & {
    visibility: visible;
  }

  svg {
    width: 100%;
    height: auto;
  }
`;

const PermalinkBase = ({ component, children, className, ...rest }: BaseProps) =>
  React.cloneElement(
    component,
    {
      className: [className, component.props.className || ''].join(' '),
      ...rest,
    },
    children
  );

// @ts-ignore Jest ESM issue https://github.com/facebook/jest/issues/9430
const { default: testTippy } = tippy;

const PermalinkCopyIcon = ({ slug }: { slug: string }) => {
  const tippyFunc = testTippy || tippy;
  React.useEffect(() => {
    tippyFunc('#docs-anchor-permalink-' + slug, {
      content: 'Click to copy anchor link',
      arrow: roundArrow,
      offset: [0, 0],
    });
  }, []);

  return (
    <span
      id={'docs-anchor-permalink-' + slug}
      onClick={event => {
        event.preventDefault();
        const url = window.location.href.replace(/#.*/, '') + '#' + slug;
        navigator.clipboard?.writeText(url);
      }}
      css={STYLES_PERMALINK_ICON}>
      <PermalinkIcon />
    </span>
  );
};

export { PermalinkCopyIcon };

const Permalink: React.FC<EnhancedProps> = withHeadingManager(
  (props: EnhancedProps & HeadingManagerProps) => {
    // NOTE(jim): Not the greatest way to generate permalinks.
    // for now I've shortened the length of permalinks.
    const component = props.children as JSX.Element;
    const children = component.props.children || '';

    if (!props.nestingLevel) {
      return children;
    }

    const heading = props.headingManager.addHeading(
      children,
      props.nestingLevel,
      props.additionalProps,
      props.id
    );

    return (
      <PermalinkBase component={component} style={props.additionalProps?.style}>
        <LinkBase css={STYLES_PERMALINK_LINK} href={'#' + heading.slug} ref={heading.ref}>
          <span css={STYLES_PERMALINK_TARGET} id={heading.slug} />
          <span css={STYLED_PERMALINK_CONTENT}>{children}</span>
          <PermalinkCopyIcon slug={heading.slug} />
        </LinkBase>
      </PermalinkBase>
    );
  }
);

export default Permalink;
