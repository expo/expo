import { GithubIcon, theme } from '@expo/styleguide';
import { Command } from 'cmdk';

import { RNDirectoryItemType } from '../types';
import { openLink } from '../utils';
import { ExternalLinkIcon } from './icons';
import { footnoteStyle, itemStyle } from './styles';

import { CALLOUT, FOOTNOTE } from '~/ui/components/Text';

type Props = {
  item: RNDirectoryItemType;
  onSelect?: () => void;
};

const numberFormat = new Intl.NumberFormat();

export const RNDirectoryItem = ({ item, onSelect }: Props) => {
  return (
    <Command.Item
      key={`hit-rnd-${item.npmPkg}`}
      value={`rnd-${item.npmPkg}`}
      onSelect={() => {
        openLink(item.githubUrl, true);
        onSelect && onSelect();
      }}>
      <div css={itemStyle}>
        <GithubIcon color={theme.icon.secondary} />
        <div>
          <CALLOUT weight="medium">{item.npmPkg}</CALLOUT>
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
