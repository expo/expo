import { ButtonBase, mergeClasses } from '@expo/styleguide';
import React from 'react';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  title: string;
  onClick: () => void;
  isSelected: boolean;
};

export function Tab({ title, onClick, isSelected }: Props) {
  return (
    <ButtonBase
      onClick={onClick}
      className={mergeClasses(
        'hocus:bg-hover rounded-md border border-transparent px-3 py-1.5 text-left',
        isSelected && 'border-default bg-default border shadow-xs'
      )}>
      <CALLOUT theme={isSelected ? 'default' : 'secondary'}>{title}</CALLOUT>
    </ButtonBase>
  );
}
