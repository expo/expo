import * as React from 'react';
import { css } from 'react-emotion';

import { BASE_HEADING_LEVEL, HeadingType } from '../common/headingManager';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';

const STYLES_LINK = css`
  ${paragraph}
  color: ${Constants.expoColors.gray[600]};
  transition: 200ms ease color;
  font-size: 14px;
  display: block;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
  cursor: pointer;

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_LINK_HEADER = css`
  font-family: ${Constants.fontFamilies.demi};
`;

const STYLES_LINK_CODE = css`
  font-family: ${Constants.fontFamilies.mono};
  font-size: 13px;
`;

const STYLES_LINK_ACTIVE = css`
  color: ${Constants.expoColors.primary[500]};
`;

const NESTING_OFFSET = 16;

/**
 * Replaces `Module.someFunction(arguments: argType)`
 * with `someFunction()`
 */
const trimCodedTitle = str => {
  const dotIdx = str.indexOf('.');
  if (dotIdx > 0) str = str.substring(dotIdx + 1);

  const parIdx = str.indexOf('(');
  if (parIdx > 0) str = str.substring(0, parIdx + 1) + ')';

  return str;
};

const DocumentationSidebarRightLink = React.forwardRef(
  ({ heading, isActive, shortenCode, onClick }, ref) => {
    const { slug, level, title, type } = heading;

    const isNested = level <= BASE_HEADING_LEVEL;
    const isCode = type === HeadingType.InlineCode;

    const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL) + 'px';
    const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;

    return (
      <div ref={ref}>
        <a
          style={{ paddingLeft }}
          href={'#' + slug}
          onClick={onClick}
          className={`
            ${STYLES_LINK}
            ${isNested && STYLES_LINK_HEADER}
            ${isCode && STYLES_LINK_CODE}
            ${isActive && STYLES_LINK_ACTIVE}
          `}>
          {displayTitle}
        </a>
      </div>
    );
  }
);

export default DocumentationSidebarRightLink;
