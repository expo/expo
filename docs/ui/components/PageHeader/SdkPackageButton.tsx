import { Button, mergeClasses } from '@expo/styleguide';
import React from 'react';

import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

export type SdkPackageButtonProps = {
  label: string;
  icon: React.ReactNode;
  tooltip: React.ReactNode;
  href: string;
};

export const SdkPackageButton = ({ label, icon, tooltip, href }: SdkPackageButtonProps) => {
  return (
    <Tooltip.Root key={label} delayDuration={500}>
      <Tooltip.Trigger asChild>
        <Button
          theme="quaternary"
          className="min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]"
          openInNewTab
          href={href}>
          <div
            className={mergeClasses(
              'flex flex-col items-center',
              'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
            )}>
            {icon}
            <FOOTNOTE crawlable={false} theme="secondary">
              {label}
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content className="max-w-[300px]">
        <FOOTNOTE>{tooltip}</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
