import { Button } from '@expo/styleguide';
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
        <Button theme="quaternary" className="justify-center px-2.5" openInNewTab href={href}>
          <div className="flex items-center gap-1.5">
            <Icon className="icon-sm text-icon-secondary" />
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
