import { BuildIcon } from '@expo/styleguide-icons';
import { CommandItemBase, addHighlight } from '@expo/styleguide-search-ui';
import React, { type ComponentType } from 'react';

type Props = {
  item: ExpoDashboardItemType;
  query: string;
  onSelect?: () => void;
};

export type ExpoDashboardItemType = {
  label: string;
  url: string;
  Icon?: ComponentType<any>;
};

export const ExpoDashboardItem = ({ item, onSelect, query }: Props) => {
  const Icon = item.Icon ?? BuildIcon;
  return (
    <CommandItemBase value={`expo-dashboard-${item.url}`} url={item.url} onSelect={onSelect}>
      <div className="inline-flex gap-3 items-center">
        <Icon className="text-icon-secondary" />
        <p
          className="text-xs font-medium"
          dangerouslySetInnerHTML={{ __html: addHighlight(item.label, query) }}
        />
      </div>
    </CommandItemBase>
  );
};
