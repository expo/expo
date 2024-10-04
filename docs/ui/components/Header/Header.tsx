import { Button, mergeClasses } from '@expo/styleguide';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Menu01Icon } from '@expo/styleguide-icons/outline/Menu01Icon';
import { Star01Icon } from '@expo/styleguide-icons/outline/Star01Icon';
import { type ReactNode } from 'react';

import { Logo } from './Logo';
import { ThemeSelector } from './ThemeSelector';

import { SidebarFooter, SidebarHead } from '~/ui/components/Sidebar';
import { DEMI } from '~/ui/components/Text';

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
      <nav className="flex items-center justify-between relative bg-default z-10 mx-auto p-0 px-4 h-[60px] border-b border-default gap-2">
        <div className="flex items-center gap-8">
          <Logo subgroup={isArchive ? 'Archive' : undefined} />
        </div>
        <div className="flex items-center gap-3">
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('px-2 text-secondary', 'max-sm-gutters:hidden')}
            href="https://expo.dev/blog">
            Blog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('px-2 text-secondary', 'max-sm-gutters:hidden')}
            href="https://expo.dev/changelog">
            Changelog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            className={mergeClasses('px-2 text-secondary', 'max-lg-gutters:hidden')}
            leftSlot={<Star01Icon className="icon-sm" />}
            href="https://github.com/expo/expo">
            Star Us on GitHub
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            href="https://github.com/expo/expo"
            aria-label="GitHub"
            className={mergeClasses('px-2 hidden', 'max-lg-gutters:flex')}>
            <GithubIcon className="icon-lg" />
          </Button>
          <div className="max-lg-gutters:hidden">
            <ThemeSelector />
          </div>
          <div className={mergeClasses('hidden', 'max-lg-gutters:flex')}>
            <Button
              theme="quaternary"
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
      </nav>
      {isMobileMenuVisible && (
        <nav
          className={mergeClasses(
            'items-center justify-between relative bg-default z-10 mx-auto p-0 px-4 h-[60px] border-b border-default hidden',
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
