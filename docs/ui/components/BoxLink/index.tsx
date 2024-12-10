import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import type { AnchorHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from 'react';

import { A, DEMI, CALLOUT } from '~/ui/components/Text';

type BoxLinkProps = AnchorHTMLAttributes<HTMLLinkElement> & {
  title: string;
  description: ReactNode;
  testID?: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  imageUrl?: string;
};

export function BoxLink({ title, description, href, testID, Icon, imageUrl }: BoxLinkProps) {
  const isExternal = Boolean(href && href.startsWith('http'));
  const ArrowIcon = isExternal ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <A
      href={href}
      className="mb-3 flex flex-row justify-between rounded-md border border-solid border-default px-4 py-3 hocus:shadow-xs"
      data-testid={testID}
      openInNewTab={isExternal}
      isStyled>
      <div className="flex flex-row gap-4">
        {Icon && (
          <div className="flex h-9 min-w-[36px] items-center justify-center self-center rounded-md bg-element">
            <Icon className="icon-lg text-icon-default" />
          </div>
        )}
        {imageUrl && <img className="!h-9 !w-9 self-center" src={imageUrl} alt="Icon" />}
        <div>
          <DEMI>{title}</DEMI>
          <CALLOUT theme="secondary">{description}</CALLOUT>
        </div>
      </div>
      <ArrowIcon className="ml-3 min-w-[20px] content-end self-center text-icon-secondary" />
    </A>
  );
}
