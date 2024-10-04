import { css } from '@emotion/react';
import { theme, Button } from '@expo/styleguide';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { GithubIcon, Menu01Icon, Star01Icon } from '@expo/styleguide-icons';
import type { ReactNode } from 'react';

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
      <nav css={[containerStyle, isMobileMenuVisible]}>
        <div css={[columnStyle, leftColumnStyle]}>
          <Logo subgroup={isArchive ? 'Archive' : undefined} />
        </div>
        <div css={[columnStyle, rightColumnStyle]}>
          <Button
            openInNewTab
            theme="quaternary"
            className="px-2 text-secondary"
            href="https://expo.dev/blog">
            Blog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            css={hideOnMobileStyle}
            className="px-2 text-secondary"
            href="https://expo.dev/changelog">
            Changelog
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            css={hideOnMobileStyle}
            className="px-2 text-secondary"
            leftSlot={<Star01Icon className="icon-sm" />}
            href="https://github.com/expo/expo">
            Star Us on GitHub
          </Button>
          <Button
            openInNewTab
            theme="quaternary"
            href="https://github.com/expo/expo"
            css={showOnMobileStyle}
            aria-label="GitHub"
            className="px-2">
            <GithubIcon className="icon-lg" />
          </Button>
          <div css={hideOnMobileStyle}>
            <ThemeSelector />
          </div>
          <div css={showOnMobileStyle}>
            <Button
              theme="quaternary"
              css={[mobileButtonStyle, isMobileMenuVisible && mobileButtonActiveStyle]}
              onClick={() => {
                setMobileMenuVisible(!isMobileMenuVisible);
              }}>
              <Menu01Icon className="icon-sm" />
            </Button>
          </div>
        </div>
      </nav>
      {isMobileMenuVisible && (
        <nav css={[containerStyle, showOnMobileStyle]}>
          <div css={[columnStyle, leftColumnStyle]}>
            <DEMI>Theme</DEMI>
          </div>
          <div css={[columnStyle, rightColumnStyle]}>
            <ThemeSelector />
          </div>
        </nav>
      )}
      {isMobileMenuVisible && (
        <div css={mobileSidebarStyle}>
          <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
          {sidebar}
          <SidebarFooter isMobileMenuVisible={isMobileMenuVisible} />
        </div>
      )}
    </>
  );
};

const containerStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  background-color: ${theme.background.default};
  z-index: 2;
  margin: 0 auto;
  padding: 0 ${spacing[4]}px;
  height: 60px;
  box-sizing: border-box;
  border-bottom: 1px solid ${theme.border.default};
  gap: ${spacing[2.5]}px;
`;

const columnStyle = css`
  flex-shrink: 0;
  display: flex;
  gap: ${spacing[8]}px;
  align-items: center;
  background-color: transparent;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    gap: ${spacing[4]}px;
  }
`;

const leftColumnStyle = css`
  flex-grow: 1;
  align-items: center;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    flex-basis: auto;
    width: auto;
  }
`;

const rightColumnStyle = css`
  justify-content: flex-end;
  gap: ${spacing[4]}px;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    flex-basis: auto;
    width: auto;
  }
`;

const showOnMobileStyle = css`
  display: none;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    display: flex;
  }
`;

const hideOnMobileStyle = css`
  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    display: none;
  }
`;

const mobileButtonStyle = css`
  padding: 0 ${spacing[3]}px;

  &:hover {
    background-color: ${theme.background.element};
    box-shadow: none;
  }
`;

const mobileButtonActiveStyle = css`
  background-color: ${theme.background.subtle};
`;

const mobileSidebarStyle = css`
  background-color: ${theme.background.subtle};
  height: calc(100vh - (60px * 2));
  overflow-y: auto;
  overflow-x: hidden;
`;
