import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import type { AnchorHTMLAttributes, ComponentType, HTMLAttributes, ReactNode } from 'react';

import { DEMI, CALLOUT } from '~/ui/components/Text';

type BoxLinkProps = AnchorHTMLAttributes<HTMLLinkElement> & {
  title: string;
  description?: ReactNode;
  testID?: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  imageUrl?: string;
};

export function BoxLink({ title, description, href, testID, Icon, imageUrl }: BoxLinkProps) {
  const isExternal = Boolean(href?.startsWith('http'));
  const ArrowIcon = isExternal ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <LinkBase
      href={href}
      // Used by scripts/generate-markdown-pages-utils.js to extract card link title/description
      data-md="card-link"
      className={mergeClasses(
        'group border-default mb-3 flex flex-row justify-between rounded-md border border-solid px-4 py-3 transition',
        'hocus:bg-subtle hocus:shadow-xs'
      )}
      data-testid={testID}
      openInNewTab={isExternal}>
      <div className="flex flex-row gap-4">
        {Icon && (
          <div className="bg-element group-hover:bg-hover flex h-9 min-w-[36px] items-center justify-center self-center rounded-md transition">
            <Icon className="icon-lg text-icon-default" />
          </div>
        )}
        {imageUrl && <img className="size-9! self-center" src={imageUrl} alt="Icon" />}
        <div className="flex flex-col self-center">
          <DEMI>{title}</DEMI>
          {description && <CALLOUT theme="secondary">{description}</CALLOUT>}
        </div>
      </div>
      <ArrowIcon className="text-icon-secondary ml-3 min-w-[20px] content-end self-center" />
    </LinkBase>
  );
}
