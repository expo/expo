import { Logo as LogoIcon, WordMarkLogo, LinkBase, mergeClasses } from '@expo/styleguide';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';

import { DocumentationIcon } from '~/ui/components/Sidebar/icons/Documentation';

type Props = {
  subgroup?: string;
};

export const Logo = ({ subgroup }: Props) => (
  <div className="flex items-center gap-4">
    <LinkBase
      className="flex flex-row items-center decoration-0 select-none gap-2 outline-offset-1"
      href="https://expo.dev">
      <WordMarkLogo
        className={mergeClasses('w-[72px] mt-px h-5 text-default my-1', 'max-md-gutters:hidden')}
        title="Expo"
      />
      <LogoIcon
        className={mergeClasses('icon-lg mr-1.5 text-default hidden', 'max-md-gutters:flex')}
        title="Expo"
      />
    </LinkBase>
    <LinkBase
      className="flex flex-row items-center decoration-0 select-none gap-2 outline-offset-1"
      href="/">
      <div className="flex items-center justify-center bg-palette-blue4 rounded-sm size-6">
        <DocumentationIcon className="icon-sm" />
      </div>
      <span
        className={mergeClasses(
          'text-default font-medium text-lg select-none',
          subgroup && 'max-md-gutters:hidden'
        )}>
        Docs
      </span>
    </LinkBase>
    {subgroup && (
      <>
        <ChevronRightIcon
          className={mergeClasses('text-icon-secondary -mx-2', 'max-md-gutters:hidden')}
        />
        <span className="text-default font-medium text-lg select-none">{subgroup}</span>
      </>
    )}
  </div>
);
