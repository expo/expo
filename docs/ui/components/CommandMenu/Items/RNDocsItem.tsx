import { Command } from 'cmdk';

import type { AlgoliaItemType } from '../types';
import { getHighlightHTML, openLink } from '../utils';
import { ExternalLinkIcon, FootnoteArrowIcon, ReactIcon } from './icons';
import { itemStyle, footnoteStyle, itemIconWrapperStyle } from './styles';

import { CALLOUT, FOOTNOTE } from '~/ui/components/Text';

type Props = {
  item: AlgoliaItemType;
  onSelect?: () => void;
};

export const RNDocsItem = ({ item, onSelect }: Props) => {
  const { lvl0, lvl1, lvl2, lvl3, lvl4 } = item.hierarchy;
  return (
    <Command.Item
      key={`hit-rn-${item.objectID}`}
      value={`rn-${item.objectID}`}
      onSelect={() => {
        openLink(item.url, true);
        onSelect && onSelect();
      }}>
      <div css={itemStyle}>
        <div css={itemIconWrapperStyle}>
          <ReactIcon />
        </div>
        {lvl4 && (
          <div>
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl4')} />
            <FOOTNOTE css={footnoteStyle}>
              <span {...getHighlightHTML(item, 'lvl0')} />
              <FootnoteArrowIcon />
              <span {...getHighlightHTML(item, 'lvl1')} />
              {lvl2 && (
                <>
                  <FootnoteArrowIcon />
                  <span {...getHighlightHTML(item, 'lvl2')} />
                </>
              )}
              {lvl3 && (
                <>
                  <FootnoteArrowIcon />
                  <span {...getHighlightHTML(item, 'lvl3')} />
                </>
              )}
            </FOOTNOTE>
          </div>
        )}
        {!lvl4 && lvl3 && (
          <div>
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl3')} />
            <FOOTNOTE css={footnoteStyle}>
              <span {...getHighlightHTML(item, 'lvl0')} />
              <FootnoteArrowIcon />
              <span {...getHighlightHTML(item, 'lvl1')} />
              {lvl2 && (
                <>
                  <FootnoteArrowIcon />
                  <span {...getHighlightHTML(item, 'lvl2')} />
                </>
              )}
            </FOOTNOTE>
          </div>
        )}
        {!lvl3 && lvl2 && (
          <div>
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl2')} />
            <FOOTNOTE css={footnoteStyle}>
              <span {...getHighlightHTML(item, 'lvl0')} />
              {lvl1 && (
                <>
                  <FootnoteArrowIcon />
                  <span {...getHighlightHTML(item, 'lvl1')} />
                </>
              )}
            </FOOTNOTE>
          </div>
        )}
        {!lvl3 && !lvl2 && lvl1 && (
          <div>
            <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl1')} />
            <FOOTNOTE css={footnoteStyle} {...getHighlightHTML(item, 'lvl0')} />
          </div>
        )}
        {!lvl3 && !lvl2 && !lvl1 && lvl0 && (
          <CALLOUT weight="medium" {...getHighlightHTML(item, 'lvl0')} />
        )}
        <ExternalLinkIcon />
      </div>
    </Command.Item>
  );
};
