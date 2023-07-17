import { GithubIcon } from '@expo/styleguide-icons';
import { Command } from 'cmdk';

import type { RNDirectoryItemType } from '../types';
import { addHighlight, openLink } from '../utils';
import { ExternalLinkIcon } from './icons';

import { CALLOUT, CAPTION } from '~/ui/components/Text';

type Props = {
  item: RNDirectoryItemType;
  query: string;
  onSelect?: () => void;
};

const numberFormat = new Intl.NumberFormat();

export const RNDirectoryItem = ({ item, onSelect, query }: Props) => {
  return (
    <Command.Item
      value={`rnd-${item.npmPkg}`}
      onSelect={() => {
        openLink(item.githubUrl, true);
        onSelect && onSelect();
      }}>
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
    </Command.Item>
  );
};
