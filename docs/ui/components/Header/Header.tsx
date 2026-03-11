import { Button, mergeClasses } from '@expo/styleguide';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Star01DuotoneIcon } from '@expo/styleguide-icons/duotone/Star01DuotoneIcon';
import { Menu01Icon } from '@expo/styleguide-icons/outline/Menu01Icon';
import { Star01Icon } from '@expo/styleguide-icons/outline/Star01Icon';
import { type ReactNode } from 'react';

import { SidebarFooter } from '~/ui/components/Sidebar/SidebarFooter';
import { SidebarHead } from '~/ui/components/Sidebar/SidebarHead';
import { DEMI } from '~/ui/components/Text';

import { Logo } from './Logo';
import { ThemeSelector } from './ThemeSelector';

type HeaderProps = {
  sidebar: ReactNode;
  sidebarActiveGroup: string;
  isMobileMenuVisible: boolean;
  setMobileMenuVisible: (isMobileMenuVisible: boolean) => void;
};

export const Header = ({
  sidebar,
  sidebarActiveGroup,
  isMobileMenuVisible,
  setMobileMenuVisible,
}: HeaderProps) => {
  const isArchive = sidebarActiveGroup === 'archive';
  return (
    <>
      <header className="border-default bg-default relative z-10 mx-auto flex h-[60px] items-center justify-between gap-2 border-b p-0 px-4">
        <div className="flex items-center gap-8">
          <Logo subgroup={isArchive ? 'Archive' : undefined} />
        </div>
        <div className="flex items-center gap-3">
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('text-secondary px-2', 'max-sm-gutters:hidden')}
            href="https://expo.dev/blog">
            Blog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('text-secondary px-2', 'max-sm-gutters:hidden')}
            href="https://expo.dev/changelog">
            Changelog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('group text-secondary px-2', 'max-lg-gutters:hidden')}
            leftSlot={
              <>
                <Star01Icon className="icon-sm group-hover:hidden group-focus-visible:hidden" />
                <Star01DuotoneIcon className="icon-sm text-icon-warning hidden group-hover:flex group-focus-visible:flex" />
              </>
            }
            href="https://github.com/expo/expo">
            Star Us on GitHub
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            href="https://github.com/expo/expo"
            aria-label="GitHub"
            className={mergeClasses('hidden px-2', 'max-lg-gutters:flex')}>
            <GithubIcon className="icon-lg" />
          </Button>
          <div className="max-lg-gutters:hidden">
            <ThemeSelector />
          </div>
          <div className={mergeClasses('hidden', 'max-lg-gutters:flex')}>
            <Button
              theme="quaternary"
              aria-label="Toggle navigation menu"
              className={mergeClasses(
                'px-3',
                'hocus:bg-element hocus:shadow-[none]',
                isMobileMenuVisible && 'bg-hover'
              )}
              onClick={() => {
                setMobileMenuVisible(!isMobileMenuVisible);
              }}>
              <Menu01Icon className="icon-sm" />
            </Button>
          </div>
        </div>
      </header>
      {isMobileMenuVisible && (
        <nav
          className={mergeClasses(
            'border-default bg-default relative z-10 mx-auto hidden h-[60px] items-center justify-between border-b p-0 px-4',
            'max-lg-gutters:flex'
          )}>
          <div className="flex items-center">
            <DEMI>Theme</DEMI>
          </div>
          <div className="flex items-center">
            <ThemeSelector />
          </div>
        </nav>
      )}
      {isMobileMenuVisible && (
        <div className="bg-subtle h-[calc(100dvh-(60px*2))] overflow-x-hidden overflow-y-auto">
          <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
          {sidebar}
          <SidebarFooter isMobileMenuVisible={isMobileMenuVisible} />
        </div>
      )}
    </>
  );
};
