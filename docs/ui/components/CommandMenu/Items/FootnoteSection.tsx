import type { AlgoliaItemHierarchy, AlgoliaItemType } from '../types';
import { getHighlightHTML } from '../utils';
import { FootnoteArrowIcon } from './icons';

export const FootnoteSection = ({
  item,
  levelKey = 'lvl0',
}: {
  item: AlgoliaItemType;
  levelKey: keyof AlgoliaItemHierarchy<string>;
}) =>
  item.hierarchy[levelKey] ? (
    <>
      <FootnoteArrowIcon />
      <span {...getHighlightHTML(item, levelKey)} />
    </>
  ) : null;
