import { mergeClasses } from '@expo/styleguide';
import type { HTMLAttributes } from 'react';

import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

type SDKRangeTagProps = {
  // Minimum SDK version (e.g., 54 renders "SDK 54+")
  min?: number | string;
  // Maximum SDK version (e.g., 53 renders "SDK <=53")
  max?: number | string;
  // Render an exact SDK version without the trailing plus
  exact?: number | string;
} & HTMLAttributes<HTMLDivElement>;

export const SDKRangeTag = ({ min, max, exact, className, ...rest }: SDKRangeTagProps) => {
  const has = (v?: number | string) => v !== undefined && v !== null && `${v}`.length > 0;

  let label = 'SDK';
  let tooltip: string | undefined;

  if (has(exact)) {
    label = `SDK ${exact}`;
    tooltip = `Available in SDK ${exact} only`;
  } else if (has(min)) {
    label = `SDK ${min}+`;
    tooltip = `Available in SDK ${min} and later`;
  } else if (has(max)) {
    label = `SDK <=${max}`;
    tooltip = `Available in SDK ${max} and earlier`;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          className={mergeClasses(
            'inline-flex min-h-[21px] select-none items-center gap-1 rounded-full border border-default bg-element px-[7px] py-0.5 align-middle',
            '[table_&]:mt-0 [table_&]:px-1.5 [table_&]:py-0.5',
            '[h2_&]:px-2 [h2_&]:py-1',
            '[h3_&]:px-2 [h3_&]:py-0.5',
            '[h4_&]:px-2 [h4_&]:py-0.5',
            '[h5_&]:px-2 [h5_&]:py-0.5',
            className
          )}
          {...rest}>
          <span
            className={mergeClasses(
              'whitespace-nowrap text-3xs font-normal leading-none',
              '[h2_&]:text-2xs'
            )}>
            {label}
          </span>
        </div>
      </Tooltip.Trigger>
      {tooltip && (
        <Tooltip.Content side="bottom" align="start">
          <FOOTNOTE>{tooltip}</FOOTNOTE>
        </Tooltip.Content>
      )}
    </Tooltip.Root>
  );
};
