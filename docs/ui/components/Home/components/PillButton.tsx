import { mergeClasses } from '@expo/styleguide';
import { type ReactNode } from 'react';

import { A } from '~/ui/components/Text';

type PillButtonProps = {
  href: string;
  children: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

export function PillButton({ href, children, leftSlot, rightSlot, className }: PillButtonProps) {
  return (
    <A
      href={href}
      isStyled
      className={mergeClasses(
        'inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-button-secondary bg-button-secondary px-1.75',
        'text-xs leading-none font-medium text-button-secondary',
        className
      )}>
      {leftSlot}
      {children}
      {rightSlot}
    </A>
  );
}
