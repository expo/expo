import { css } from '@emotion/react';
import { theme, SnackLogo } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { ChangelogIcon, DiscordIcon, MessageDotsSquareIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/router';

import { SidebarSingleEntry } from './SidebarSingleEntry';
import { ArchiveIcon } from './icons/Archive';

import { getPageSection } from '~/common/routes';

export const SidebarFooter = () => {
  const { pathname } = useRouter();
  const isArchive = getPageSection(pathname) === 'archive';
  return (
    <div css={sidebarFooterContainer}>
      <SidebarSingleEntry
        secondary
        href="/archive"
        title="Archive"
        Icon={ArchiveIcon}
        isActive={isArchive}
      />
      <SidebarSingleEntry
        secondary
        href="https://snack.expo.dev"
        title="Expo Snack"
        Icon={SnackLogo}
        isExternal
      />
      <SidebarSingleEntry
        secondary
        href="https://chat.expo.dev"
        title="Discord"
        Icon={DiscordIcon}
        isExternal
      />
      <SidebarSingleEntry
        secondary
        href="https://forums.expo.dev"
        title="Forums"
        Icon={MessageDotsSquareIcon}
        isExternal
      />
      <SidebarSingleEntry
        secondary
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
