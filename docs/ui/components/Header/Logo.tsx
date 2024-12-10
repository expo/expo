import { Logo as LogoIcon, WordMarkLogo, LinkBase, mergeClasses } from '@expo/styleguide';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';

import { DocumentationIcon } from '~/ui/components/Sidebar/icons/Documentation';

type Props = {
  subgroup?: string;
};

export const Logo = ({ subgroup }: Props) => (
  <div className="flex items-center gap-4">
    <LinkBase
      className="flex select-none flex-row items-center gap-2 decoration-0 outline-offset-1"
      href="https://expo.dev">
      <WordMarkLogo
        className={mergeClasses('mt-px h-5 w-[72px] text-default', 'max-md-gutters:hidden')}
        title="Expo"
      />
      <LogoIcon
        className={mergeClasses('icon-lg mr-1.5 hidden text-default', 'max-md-gutters:flex')}
        title="Expo"
      />
    </LinkBase>
    <LinkBase
      className="flex select-none flex-row items-center gap-2 decoration-0 outline-offset-1"
      href="/">
      <div className="flex size-6 items-center justify-center rounded-sm bg-palette-blue4">
        <DocumentationIcon className="icon-sm" />
      </div>
      <span
        className={mergeClasses(
          'select-none text-lg font-medium text-default',
          subgroup && 'max-md-gutters:hidden'
        )}>
        Docs
      </span>
    </LinkBase>
    {subgroup && (
      <>
        <ChevronRightIcon
          className={mergeClasses('-mx-2 text-icon-secondary', 'max-md-gutters:hidden')}
        />
        <span className="select-none text-lg font-medium text-default">{subgroup}</span>
      </>
    )}
  </div>
);
