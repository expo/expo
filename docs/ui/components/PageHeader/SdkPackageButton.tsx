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
        <Button
          theme="quaternary"
          size="2xs"
          className="h-auto border-0 px-0 hocus:bg-transparent hocus:opacity-80"
          openInNewTab
          href={href}
          aria-label={label}>
          <div className="flex items-center gap-1">
            <Icon aria-hidden="true" className="icon-xs text-icon-default" />
            <FOOTNOTE crawlable={false} theme="secondary" className="leading-[1.6] max-md:hidden">
              {label}
            </FOOTNOTE>
          </div>
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content sideOffset={8} className="max-w-75">
        <FOOTNOTE>{tooltip}</FOOTNOTE>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
