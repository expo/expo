import { GithubIcon } from '@expo/styleguide-icons';

import { CommandItemBase } from './CommandItemBase';
import { ExternalLinkIcon } from './icons';
import type { RNDirectoryItemType } from '../types';
import { addHighlight } from '../utils';

import { CALLOUT, CAPTION } from '~/ui/components/Text';

type Props = {
  item: RNDirectoryItemType;
  query: string;
  onSelect?: () => void;
};

const numberFormat = new Intl.NumberFormat();

export const RNDirectoryItem = ({ item, onSelect, query }: Props) => {
  return (
    <CommandItemBase
      value={`rnd-${item.npmPkg}`}
      url={item.githubUrl}
      isExternalLink
      onSelect={onSelect}>
      <div className="inline-flex gap-3 items-center">
        <GithubIcon className="text-icon-secondary" />
        <div>
          <CALLOUT
            weight="medium"
            dangerouslySetInnerHTML={{ __html: addHighlight(item.npmPkg, query) }}
          />
          <CAPTION theme="quaternary">
            {numberFormat.format(item.github.stats.stars)} stars ·{' '}
            {numberFormat.format(item.npm.downloads)} downloads
          </CAPTION>
        </div>
        <ExternalLinkIcon />
      </div>
    </CommandItemBase>
  );
};
