import { ButtonBase, mergeClasses } from '@expo/styleguide';
import { FileCode01Icon } from '@expo/styleguide-icons/outline/FileCode01Icon';
import { FolderIcon } from '@expo/styleguide-icons/outline/FolderIcon';
import React from 'react';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  title: string;
  onClick: () => void;
  isSelected: boolean;
  type: 'directory' | 'file';
};

export function Tab({ title, onClick, isSelected, type }: Props) {
  return (
    <ButtonBase
      onClick={onClick}
      className={mergeClasses(
        'items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-left hocus:bg-hover',
        isSelected && 'border border-default bg-default shadow-xs'
      )}>
      {type === 'directory' ? <FolderIcon className="icon-sm text-icon-tertiary" /> : null}
      {type === 'file' ? <FileCode01Icon className="icon-sm text-icon-tertiary" /> : null}
      <CALLOUT theme={isSelected ? 'default' : 'secondary'}>{title}</CALLOUT>
    </ButtonBase>
  );
}
