import * as React from 'react';
import { css } from 'react-emotion';

import { BASE_HEADING_LEVEL, HeadingType } from '../common/headingManager';

import * as Constants from '~/common/constants';
import { paragraph } from '~/components/base/typography';

const STYLES_LINK = css`
  display: block;
  line-height: 1.3rem;
  text-decoration: none;
`;

const STYLES_LINK_NESTED = css`
  display: block;
  font-size: 15px;
  margin-bottom: 2px;
  line-height: 1.3rem;
  text-decoration: none;
`;

const STYLES_ACTIVE_CONTAINER = css`
  display: flex;
  margin-bottom: 6px;
  cursor: pointer;
`;

const STYLES_ACTIVE_BULLET = css`
  min-height: 6px;
  min-width: 6px;
  height: 6px;
  width: 6px;
  background-color: ${Constants.expoColors.primary[500]};
  border-radius: 4px;
  position: relative;
  left -12px;
  top: 7px;
`;

const STYLES_LINK_ACTIVE = css`
  ${paragraph}
  font-size: 15px;
  line-height: 140%;
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.expoLighter};
  position: relative;
  left -7px;

  :visited {
    color: ${Constants.expoColors.primary[500]};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_LINK_DEFAULT = css`
  ${paragraph}
  color: ${Constants.colors.black80};
  line-height: 140%;
  transition: 200ms ease color;
  font-size: 15px;

  :visited {
    color: ${Constants.colors.black60};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const NESTING_OFFSET = 12;

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

const DocumentationSidebarRightLink = ({ heading, isActive, shortenCode }) => {
  const { slug, level, title, type } = heading;

  const paddingLeft = NESTING_OFFSET * (level - BASE_HEADING_LEVEL) + 'px';
  const linkBaseStyle = level <= BASE_HEADING_LEVEL ? STYLES_LINK : STYLES_LINK_NESTED;

  const isCode = type === HeadingType.Code;
  const displayTitle = shortenCode && isCode ? trimCodedTitle(title) : title;
  const linkFont = isCode ? Constants.fontFamilies.mono : undefined;
  const fontSize = isCode ? 14 : undefined;

  return (
    <div className={STYLES_ACTIVE_CONTAINER}>
      {isActive && <div className={STYLES_ACTIVE_BULLET} />}
      <a
        style={{ paddingLeft, fontFamily: linkFont, fontSize }}
        href={'#' + slug}
        className={`${linkBaseStyle} ${isActive ? STYLES_LINK_ACTIVE : STYLES_LINK_DEFAULT}`}>
        {displayTitle}
      </a>
    </div>
  );
};

export default DocumentationSidebarRightLink;
