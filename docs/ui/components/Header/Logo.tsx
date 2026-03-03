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
        className={mergeClasses('text-default mt-px h-5 w-[72px]', 'max-md-gutters:hidden')}
        title="Expo"
      />
      <LogoIcon
        className={mergeClasses('icon-lg text-default mr-1.5 hidden', 'max-md-gutters:flex')}
        title="Expo"
      />
    </LinkBase>
    <LinkBase
      className="flex flex-row items-center gap-2 decoration-0 outline-offset-1 select-none"
      href="/">
      <div className="bg-palette-blue4 flex size-6 items-center justify-center rounded-sm">
        <DocumentationIcon className="icon-sm" />
      </div>
      <span
        className={mergeClasses(
          'text-default text-lg font-medium select-none',
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
        <span className="text-default text-lg font-medium select-none">{subgroup}</span>
      </>
    )}
  </div>
);
