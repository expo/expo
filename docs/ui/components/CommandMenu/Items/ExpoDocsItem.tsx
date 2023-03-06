import { DocsLogo } from '@expo/styleguide';
import { PlanEnterpriseIcon, BookClosedIcon } from '@expo/styleguide-icons';
import { Command } from 'cmdk';

import type { AlgoliaItemType } from '../types';
import { getContentHighlightHTML, getHighlightHTML, isEASPath, openLink } from '../utils';
import { FootnoteSection } from './FootnoteSection';
import { FootnoteArrowIcon } from './icons';
import { contentStyle, footnoteStyle, itemIconWrapperStyle, itemStyle } from './styles';

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
    return <DocsLogo className="icon-md text-icon-secondary" />;
  } else if (isEASPath(url)) {
    return <PlanEnterpriseIcon className="icon-md text-icon-secondary" />;
  }
  return <BookClosedIcon className="icon-md text-icon-secondary" />;
};

const getFootnotePrefix = (url: string) => {
  if (url.includes('/versions/')) {
    return 'API Reference';
  } else if (isEASPath(url)) {
    return 'Expo Application Services';
  } else {
    return 'Guides';
  }
};

const ItemFootnotePrefix = ({ url, isNested = false }: { url: string; isNested?: boolean }) => {
  return isNested ? (
    <>
      <span css={footnoteStyle}>{getFootnotePrefix(url)}</span>
      <FootnoteArrowIcon />
    </>
  ) : (
    <FOOTNOTE css={footnoteStyle}>{getFootnotePrefix(url)}</FOOTNOTE>
  );
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
  const { lvl0, lvl2, lvl3, lvl4, lvl6 } = item.hierarchy;
  return (
    <Command.Item
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
          {lvl6 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl6')} />
              <FOOTNOTE css={footnoteStyle}>
                <ItemFootnotePrefix url={item.url} isNested />
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl2" />
                <FootnoteSection item={item} levelKey="lvl3" />
                <FootnoteSection item={item} levelKey="lvl4" />
              </FOOTNOTE>
            </>
          )}
          {!lvl6 && lvl4 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl4')} />
              <FOOTNOTE css={footnoteStyle}>
                <ItemFootnotePrefix url={item.url} isNested />
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl2" />
                <FootnoteSection item={item} levelKey="lvl3" />
              </FOOTNOTE>
            </>
          )}
          {!lvl6 && !lvl4 && lvl3 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl3')} />
              <FOOTNOTE css={footnoteStyle}>
                <ItemFootnotePrefix url={item.url} isNested />
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl2" />
              </FOOTNOTE>
            </>
          )}
          {!lvl6 && !lvl4 && !lvl3 && lvl2 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl2')} />
              <FOOTNOTE css={footnoteStyle}>
                <ItemFootnotePrefix url={item.url} isNested />
                <span {...getHighlightHTML(item, 'lvl0')} />
              </FOOTNOTE>
            </>
          )}
          {!lvl6 && !lvl4 && !lvl3 && !lvl2 && lvl0 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl0')} />
              <ItemFootnotePrefix url={item.url} />
            </>
          )}
          <FOOTNOTE theme="secondary" {...getContentHighlightHTML(item)} css={contentStyle} />
        </div>
      </div>
    </Command.Item>
  );
};
