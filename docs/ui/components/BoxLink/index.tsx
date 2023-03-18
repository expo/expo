import { ArrowRightIcon, ArrowUpRightIcon } from '@expo/styleguide-icons';
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';

import { A, DEMI, P } from '~/ui/components/Text';

type BoxLinkProps = AnchorHTMLAttributes<HTMLLinkElement> & {
  title: string;
  description: ReactNode;
  testID?: string;
  Icon?: ComponentType<any>;
};

export function BoxLink({ title, description, href, testID, Icon }: BoxLinkProps) {
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
        <div>
          <DEMI>{title}</DEMI>
          <P>{description}</P>
        </div>
      </div>
      <ArrowIcon className="text-icon-secondary self-center content-end ml-3 min-w-[20px]" />
    </A>
  );
}
