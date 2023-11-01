import { CommandItemBase } from './CommandItemBase';
import { FootnoteSection } from './FootnoteSection';
import { ExternalLinkIcon, ReactIcon } from './icons';
import type { AlgoliaItemType } from '../types';
import { getContentHighlightHTML, getHighlightHTML } from '../utils';

import { CALLOUT, CAPTION, FOOTNOTE } from '~/ui/components/Text';

type Props = {
  item: AlgoliaItemType;
  onSelect?: () => void;
};

export const RNDocsItem = ({ item, onSelect }: Props) => {
  const { lvl0, lvl1, lvl2, lvl3, lvl4 } = item.hierarchy;
  return (
    <CommandItemBase
      value={`rn-${item.objectID}`}
      url={item.url}
      isExternalLink
      onSelect={onSelect}>
      <div className="inline-flex gap-3 items-center">
        <ReactIcon className="shrink-0" />
        <div>
          {lvl4 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl4')} />
              <CAPTION theme="quaternary">
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl1" />
                <FootnoteSection item={item} levelKey="lvl2" />
                <FootnoteSection item={item} levelKey="lvl3" />
              </CAPTION>
            </>
          )}
          {!lvl4 && lvl3 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl3')} />
              <CAPTION theme="quaternary">
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl1" />
                <FootnoteSection item={item} levelKey="lvl2" />
              </CAPTION>
            </>
          )}
          {!lvl3 && lvl2 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl2')} />
              <CAPTION theme="quaternary">
                <span {...getHighlightHTML(item, 'lvl0')} />
                <FootnoteSection item={item} levelKey="lvl1" />
              </CAPTION>
            </>
          )}
          {!lvl3 && !lvl2 && lvl1 && (
            <>
              <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl1')} />
              <CAPTION theme="quaternary" {...getHighlightHTML(item, 'lvl0')} />
            </>
          )}
          {!lvl3 && !lvl2 && !lvl1 && lvl0 && (
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl0')} />
          )}
          <FOOTNOTE theme="secondary" {...getContentHighlightHTML(item, true)} />
        </div>
        <ExternalLinkIcon />
      </div>
    </CommandItemBase>
  );
};
