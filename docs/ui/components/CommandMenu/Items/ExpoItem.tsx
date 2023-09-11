import { BuildIcon } from '@expo/styleguide-icons';

import type { ExpoItemType } from '../types';
import { addHighlight } from '../utils';
import { CommandItemBase } from './CommandItemBase';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  item: ExpoItemType;
  query: string;
  onSelect?: () => void;
};

export const ExpoItem = ({ item, onSelect, query }: Props) => {
  const Icon = item.Icon ?? BuildIcon;
  return (
    <CommandItemBase value={`expo-${item.url}`} url={item.url} onSelect={onSelect}>
      <div className="inline-flex gap-3 items-center">
        <Icon className="text-icon-secondary" />
        <CALLOUT
          weight="medium"
          dangerouslySetInnerHTML={{ __html: addHighlight(item.label, query) }}
        />
      </div>
    </CommandItemBase>
  );
};
