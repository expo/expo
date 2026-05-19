import { Logo as LogoIcon, WordMarkLogo, LinkBase, mergeClasses } from '@expo/styleguide';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';

import { DocumentationIcon } from '~/ui/components/Sidebar/icons/Documentation';

type Props = {
  subgroup?: string;
};

export const Logo = ({ subgroup }: Props) => (
  <div className="flex items-center gap-4">
    <LinkBase
      className="flex flex-row items-center gap-2 decoration-0 outline-offset-1 select-none"
      href="https://expo.dev">
      <WordMarkLogo
        className={mergeClasses('mt-px h-5 w-18 text-default', 'max-md:hidden')}
        title="Expo"
      />
      <LogoIcon
        className={mergeClasses('mr-1.5 hidden icon-lg text-default', 'max-md:flex')}
        title="Expo"
      />
    </LinkBase>
    <LinkBase
      className="flex flex-row items-center gap-2 decoration-0 outline-offset-1 select-none"
      href="/">
      <div className="flex size-6 items-center justify-center rounded-sm bg-palette-blue4">
        <DocumentationIcon className="icon-sm" />
      </div>
      <span
        className={mergeClasses(
          'text-lg font-medium text-default select-none',
          subgroup && 'max-md:hidden'
        )}>
        Docs
      </span>
    </LinkBase>
    {subgroup && (
      <>
        <ChevronRightIcon className={mergeClasses('-mx-2 text-icon-secondary', 'max-md:hidden')} />
        <span className="text-lg font-medium text-default select-none">{subgroup}</span>
      </>
    )}
  </div>
);
