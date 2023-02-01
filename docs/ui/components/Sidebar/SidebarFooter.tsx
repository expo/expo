import { css } from '@emotion/react';
import {
  spacing,
  theme,
  SnackLogo,
  ChangelogIcon,
  DiscordIcon,
  MessageIcon,
  iconSize,
} from '@expo/styleguide';
import { useRouter } from 'next/router';

import { SidebarSingleEntry } from './SidebarSingleEntry';
import { ArchiveIcon } from './icons/Archive';

import { getPageSection } from '~/common/routes';
import { customIconContainerStyle } from '~/ui/components/Sidebar/icons/styles';

export const SidebarFooter = () => {
  const { pathname } = useRouter();
  return (
    <div css={sidebarFooterContainer}>
      <SidebarSingleEntry
        href="/archive"
        title="Archive"
        Icon={() => (
          <div css={[customIconContainerStyle, { width: iconSize.sm }]}>
            <ArchiveIcon />
          </div>
        )}
        isActive={getPageSection(pathname) === 'archive'}
      />
      <SidebarSingleEntry
        href="https://snack.expo.dev"
        title="Expo Snack"
        Icon={SnackLogo}
        isExternal
      />
      <SidebarSingleEntry
        href="https://chat.expo.dev"
        title="Discord"
        Icon={DiscordIcon}
        isExternal
      />
      <SidebarSingleEntry
        href="https://forums.expo.dev"
        title="Forums"
        Icon={MessageIcon}
        isExternal
      />
      <SidebarSingleEntry
        href="https://expo.dev/changelog"
        title="Changelog"
        Icon={ChangelogIcon}
        isExternal
      />
    </div>
  );
};

const sidebarFooterContainer = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[4],
  borderTop: `1px solid ${theme.border.default}`,
  background: theme.background.default,
});
