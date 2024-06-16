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
        'py-1.5 px-3 rounded-md hocus:bg-hover border border-transparent text-left',
        isSelected && 'bg-default border-default border shadow-xs'
      )}>
      <CALLOUT theme={isSelected ? 'default' : 'secondary'}>{title}</CALLOUT>
    </ButtonBase>
  );
}
