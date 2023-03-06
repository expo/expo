import { BuildIcon } from '@expo/styleguide-icons';
import { Command } from 'cmdk';

import type { ExpoItemType } from '../types';
import { addHighlight, openLink } from '../utils';
import { itemStyle } from './styles';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  item: ExpoItemType;
  query: string;
  onSelect?: () => void;
};

export const ExpoItem = ({ item, onSelect, query }: Props) => {
  const Icon = item.Icon ?? BuildIcon;
  return (
    <Command.Item
      value={`expo-${item.url}`}
      onSelect={() => {
        openLink(item.url);
        onSelect && onSelect();
      }}>
      <div css={itemStyle}>
        <Icon className="icon-md text-icon-secondary" />
        <CALLOUT
          weight="medium"
          dangerouslySetInnerHTML={{ __html: addHighlight(item.label, query) }}
        />
      </div>
    </Command.Item>
  );
};
