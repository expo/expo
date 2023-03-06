import { GithubIcon } from '@expo/styleguide-icons';
import { Command } from 'cmdk';

import type { RNDirectoryItemType } from '../types';
import { addHighlight, openLink } from '../utils';
import { ExternalLinkIcon } from './icons';
import { footnoteStyle, itemStyle } from './styles';

import { CALLOUT, FOOTNOTE } from '~/ui/components/Text';

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
      <div css={itemStyle}>
        <GithubIcon className="icon-md text-icon-secondary" />
        <div>
          <CALLOUT
            weight="medium"
            dangerouslySetInnerHTML={{ __html: addHighlight(item.npmPkg, query) }}
          />
          <FOOTNOTE css={footnoteStyle}>
            {numberFormat.format(item.github.stats.stars)} stars ·{' '}
            {numberFormat.format(item.npm.downloads)} downloads
          </FOOTNOTE>
        </div>
        <ExternalLinkIcon />
      </div>
    </Command.Item>
  );
};
