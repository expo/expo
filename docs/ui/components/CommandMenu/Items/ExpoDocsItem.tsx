import { DocsLogo, PlanEnterpriseIcon, iconSize, theme } from '@expo/styleguide';
import { Command } from 'cmdk';

import type { AlgoliaItemType } from '../types';
import { getHighlightHTML, isEASPath, openLink } from '../utils';
import { FootnoteArrowIcon, GuideIcon } from './icons';
import { footnoteStyle, itemIconWrapperStyle, itemStyle } from './styles';

import versions from '~/public/static/constants/versions.json';
import { CALLOUT, FOOTNOTE } from '~/ui/components/Text';

const { LATEST_VERSION } = versions;

type Props = {
  item: AlgoliaItemType;
  onSelect?: () => void;
};

const isDev = process.env.NODE_ENV === 'development';

const ItemIcon = ({ url }: { url: string }) => {
  if (url.includes('/versions/')) {
    return <DocsLogo width={iconSize.regular} color={theme.icon.secondary} />;
  } else if (isEASPath(url)) {
    return <PlanEnterpriseIcon color={theme.icon.secondary} />;
  }
  return <GuideIcon />;
};

const transformUrl = (url: string) => {
  if (url.includes(LATEST_VERSION)) {
    url = url.replace(LATEST_VERSION, 'latest');
  }
  if (isDev) {
    url = url.replace('https://docs.expo.dev/', 'http://localhost:3002/');
  }
  return url;
};

export const ExpoDocsItem = ({ item, onSelect }: Props) => {
  const { lvl0, lvl2, lvl3 } = item.hierarchy;
  return (
    <Command.Item
      key={`hit-expodocs-${item.objectID}`}
      value={`expodocs-${item.objectID}`}
      onSelect={() => {
        openLink(transformUrl(item.url));
        onSelect && onSelect();
      }}>
      <div css={itemStyle}>
        <div css={itemIconWrapperStyle}>
          <ItemIcon url={item.url} />
        </div>
        <div>
          {lvl3 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl3')} />
              <FOOTNOTE css={footnoteStyle}>
                <span {...getHighlightHTML(item, 'lvl0')} />
                {lvl2 && (
                  <>
                    <FootnoteArrowIcon />
                    <span {...getHighlightHTML(item, 'lvl2')} />
                  </>
                )}
              </FOOTNOTE>
            </>
          )}
          {!lvl3 && lvl2 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl2')} />
              <FOOTNOTE css={footnoteStyle} {...getHighlightHTML(item, 'lvl0')} />
            </>
          )}
          {!lvl3 && !lvl2 && lvl0 && (
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl0')} />
          )}
        </div>
      </div>
    </Command.Item>
  );
};
