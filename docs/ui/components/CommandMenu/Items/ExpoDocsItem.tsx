import { DocsLogo, mergeClasses } from '@expo/styleguide';
import {
  PlanEnterpriseIcon,
  BookOpen02Icon,
  GraduationHat02Icon,
  Home02Icon,
  Hash02Icon,
} from '@expo/styleguide-icons';
import { Command } from 'cmdk';

import type { AlgoliaItemType } from '../types';
import {
  getContentHighlightHTML,
  getHighlightHTML,
  isReferencePath,
  isEASPath,
  openLink,
  isHomePath,
  isLearnPath,
} from '../utils';
import { FootnoteSection } from './FootnoteSection';
import { FootnoteArrowIcon } from './icons';

import versions from '~/public/static/constants/versions.json';
import { CALLOUT, CAPTION, FOOTNOTE } from '~/ui/components/Text';

const { LATEST_VERSION } = versions;

type Props = {
  item: AlgoliaItemType;
  onSelect?: () => void;
  isNested?: boolean;
};

type ItemIconProps = {
  url: string;
  className?: string;
  isNested?: boolean;
};

const isDev = process.env.NODE_ENV === 'development';

const ItemIcon = ({ url, className, isNested }: ItemIconProps) => {
  if (isNested) {
    return <Hash02Icon className={mergeClasses('icon-sm text-icon-quaternary', className)} />;
  } else if (isReferencePath(url)) {
    return <DocsLogo className={mergeClasses('text-icon-secondary', className)} />;
  } else if (isEASPath(url)) {
    return <PlanEnterpriseIcon className={mergeClasses('text-icon-secondary', className)} />;
  } else if (isHomePath(url)) {
    return <Home02Icon className={mergeClasses('text-icon-secondary', className)} />;
  } else if (isLearnPath(url)) {
    return <GraduationHat02Icon className={mergeClasses('text-icon-secondary', className)} />;
  }
  return <BookOpen02Icon className={mergeClasses('text-icon-secondary', className)} />;
};

const getFootnotePrefix = (url: string) => {
  if (isReferencePath(url)) {
    return 'Reference';
  } else if (isEASPath(url)) {
    return 'Expo Application Services';
  } else if (isHomePath(url)) {
    return 'Home';
  } else if (isLearnPath(url)) {
    return 'Learn';
  } else {
    return 'Guides';
  }
};

const ItemFootnotePrefix = ({ url, isNested = false }: { url: string; isNested?: boolean }) => {
  return isNested ? (
    <>
      <CAPTION theme="quaternary" tag="span">
        {getFootnotePrefix(url)}
      </CAPTION>
      <FootnoteArrowIcon />
    </>
  ) : (
    <CAPTION theme="quaternary">{getFootnotePrefix(url)}</CAPTION>
  );
};

const transformUrl = (url: string) => {
  if (url.includes(LATEST_VERSION)) {
    url = url.replace(LATEST_VERSION, 'latest');
  }
  if (isDev) {
    url = url.replace('https://docs.expo.dev/', 'http://localhost:3002/');
  }

  // If viewing a docs preview hosted on S3, use the current origin instead of production
  if (window?.location?.origin?.includes('s3-website-us-east-1.amazonaws.com')) {
    url = url.replace('https://docs.expo.dev/', window.location.origin + '/');
  }

  return url;
};

export const ExpoDocsItem = ({ item, onSelect, isNested }: Props) => {
  const { lvl0, lvl2, lvl3, lvl4, lvl6 } = item.hierarchy;
  const TitleElement = isNested ? FOOTNOTE : CALLOUT;
  const ContentElement = isNested ? CAPTION : FOOTNOTE;
  const titleWeight = isNested ? 'regular' : 'medium';
  return (
    <Command.Item
      className={mergeClasses(isNested && 'ml-8 !mt-0.5 !min-h-[32px]')}
      value={`expodocs-${item.objectID}`}
      onSelect={() => {
        openLink(transformUrl(item.url));
        onSelect && onSelect();
      }}
      data-nested={isNested ? true : undefined}>
      <div className={mergeClasses('inline-flex items-center gap-3 break-words')}>
        <ItemIcon url={item.url} isNested={isNested} className="shrink-0" />
        <div>
          {lvl6 && (
            <>
              <TitleElement weight={titleWeight} {...getHighlightHTML(item, 'lvl6')} />
              {!isNested && (
                <CAPTION theme="quaternary">
                  <ItemFootnotePrefix url={item.url} isNested />
                  <span {...getHighlightHTML(item, 'lvl0')} />
                  <FootnoteSection item={item} levelKey="lvl2" />
                  <FootnoteSection item={item} levelKey="lvl3" />
                  <FootnoteSection item={item} levelKey="lvl4" />
                </CAPTION>
              )}
            </>
          )}
          {!lvl6 && lvl4 && (
            <>
              <TitleElement weight={titleWeight} {...getHighlightHTML(item, 'lvl4')} />
              {!isNested && (
                <CAPTION theme="quaternary" className={isNested ? '!hidden' : ''}>
                  <ItemFootnotePrefix url={item.url} isNested />
                  <span {...getHighlightHTML(item, 'lvl0')} />
                  <FootnoteSection item={item} levelKey="lvl2" />
                  <FootnoteSection item={item} levelKey="lvl3" />
                </CAPTION>
              )}
            </>
          )}
          {!lvl6 && !lvl4 && lvl3 && (
            <>
              <TitleElement weight={titleWeight} {...getHighlightHTML(item, 'lvl3')} />
              {!isNested && (
                <CAPTION theme="quaternary" className={isNested ? '!hidden' : ''}>
                  <ItemFootnotePrefix url={item.url} isNested />
                  <span {...getHighlightHTML(item, 'lvl0')} />
                  <FootnoteSection item={item} levelKey="lvl2" />
                </CAPTION>
              )}
            </>
          )}
          {!lvl6 && !lvl4 && !lvl3 && lvl2 && (
            <>
              <TitleElement weight={titleWeight} {...getHighlightHTML(item, 'lvl2')} />
              {!isNested && (
                <CAPTION theme="quaternary" className={isNested ? '!hidden' : ''}>
                  <ItemFootnotePrefix url={item.url} isNested />
                  <span {...getHighlightHTML(item, 'lvl0')} />
                </CAPTION>
              )}
            </>
          )}
          {!lvl6 && !lvl4 && !lvl3 && !lvl2 && lvl0 && (
            <>
              <TitleElement weight={titleWeight} {...getHighlightHTML(item, 'lvl0')} />
              <ItemFootnotePrefix url={item.url} />
            </>
          )}
          {(!isNested || item.content) && (
            <ContentElement theme="secondary" {...getContentHighlightHTML(item)} />
          )}
        </div>
      </div>
    </Command.Item>
  );
};
