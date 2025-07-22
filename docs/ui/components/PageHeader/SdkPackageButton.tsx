import { Button, mergeClasses } from '@expo/styleguide';
import { ComponentType, HTMLAttributes, ReactNode } from 'react';

import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

export type SdkPackageButtonProps = {
  label: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  tooltip: ReactNode;
  href: string;
};

export const SdkPackageButton = ({ label, Icon, tooltip, href }: SdkPackageButtonProps) => {
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
            <Icon className="mt-0.5 text-icon-secondary" />
            <FOOTNOTE crawlable={false} theme="secondary">
              {label}
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-[300px]">
        <FOOTNOTE>{tooltip}</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
