import { mergeClasses } from '@expo/styleguide';
import type { ElementType, HTMLAttributes } from 'react';

export type DocIconProps = HTMLAttributes<SVGSVGElement> & {
  Icon?: ElementType;
  small?: boolean;
};

export const IconBase = ({ className, small, Icon, ...rest }: DocIconProps) => {
  if (!Icon) return null;

  return (
    <Icon
      className={mergeClasses(
        'inline-block',
        small ? 'icon-sm' : 'icon-md',
        'text-icon-default',
        '[table_&]:align-middle [li_&]:align-middle [li_&]:-mt-0.5',
        className
      )}
      {...rest}
    />
  );
};
