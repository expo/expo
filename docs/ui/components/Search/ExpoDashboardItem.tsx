import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { addHighlight, CommandItemBaseWithCopy } from '@expo/styleguide-search-ui';
import { type ComponentType, HTMLAttributes } from 'react';

type Props = {
  item: ExpoDashboardItemType;
  query: string;
  onSelect?: () => void;
};

export type ExpoDashboardItemType = {
  label: string;
  url: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
};

export const ExpoDashboardItem = ({ item, onSelect, query }: Props) => {
  const Icon = item.Icon ?? BuildIcon;
  return (
    <CommandItemBaseWithCopy
      value={`expo-dashboard-${item.url}`}
      url={item.url}
      onSelect={onSelect}
      isExternalLink>
      <div className="flex gap-3 justify-between">
        <div className="inline-flex gap-3 items-center justify-between">
          <Icon className="text-icon-secondary" />
          <p
            className="text-xs font-medium"
            dangerouslySetInnerHTML={{ __html: addHighlight(item.label, query) }}
          />
        </div>
        <ArrowUpRightIcon className="text-icon-tertiary" />
      </div>
    </CommandItemBaseWithCopy>
  );
};
