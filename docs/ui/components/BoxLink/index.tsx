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
      className="flex flex-row justify-between border border-solid border-default rounded-md py-3 px-4 mb-3 hocus:shadow-xs"
      data-testid={testID}
      openInNewTab={isExternal}
      isStyled>
      <div className="flex flex-row gap-4">
        {Icon && (
          <div className="flex bg-element rounded-md self-center items-center justify-center min-w-[36px] h-9">
            <Icon className="icon-lg text-icon-default" />
          </div>
        )}
        {imageUrl && <img className="!w-9 !h-9 self-center" src={imageUrl} alt="Icon" />}
        <div>
          <DEMI>{title}</DEMI>
          <CALLOUT theme="secondary">{description}</CALLOUT>
        </div>
      </div>
      <ArrowIcon className="text-icon-secondary self-center content-end ml-3 min-w-[20px]" />
    </A>
  );
}
