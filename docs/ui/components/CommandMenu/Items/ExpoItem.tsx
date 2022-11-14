import { BuildIcon, theme } from '@expo/styleguide';
import { Command } from 'cmdk';

import { ExpoItemType } from '../types';
import { openLink } from '../utils';
import { itemStyle } from './styles';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  item: ExpoItemType;
  onSelect?: () => void;
};

export const ExpoItem = ({ item, onSelect }: Props) => {
  const Icon = item.Icon ?? BuildIcon;
  return (
    <Command.Item
      key={`hit-expo-${item.url}`}
      value={`expo-${item.url}`}
      onSelect={() => {
        openLink(item.url);
        onSelect && onSelect();
      }}>
      <div css={itemStyle}>
        <Icon color={theme.icon.secondary} />
        <div>
          <CALLOUT weight="medium">{item.label}</CALLOUT>
        </div>
      </div>
    </Command.Item>
  );
};
