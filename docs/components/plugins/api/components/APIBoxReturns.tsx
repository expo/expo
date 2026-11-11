import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';
import type { PropsWithChildren } from 'react';

import { STYLES_SECONDARY } from '../styles';

type Props = PropsWithChildren<{
  className?: string;
}>;

export function APIBoxReturns({ children, className }: Props) {
  return (
    <div
      data-md="api-returns"
      className={mergeClasses('flex flex-row items-start gap-2', className)}>
      <div className="flex flex-row items-center gap-2">
        <CornerDownRightIcon
          aria-hidden="true"
          className="relative -mt-0.5 inline-block icon-sm text-icon-tertiary"
        />
        <span className={STYLES_SECONDARY}>Returns:</span>
      </div>
      {children}
    </div>
  );
}
