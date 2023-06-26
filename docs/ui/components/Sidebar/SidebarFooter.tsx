import { SnackLogo } from '@expo/styleguide';
import {
  Certificate02Icon,
  ChangelogIcon,
  DiscordIcon,
  MessageDotsSquareIcon,
} from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';

import { SidebarSingleEntry } from './SidebarSingleEntry';
import { ArchiveIcon } from './icons/Archive';

import { getPageSection } from '~/common/routes';

export const SidebarFooter = () => {
  const router = useRouter();
  const isArchive = router?.pathname ? getPageSection(router.pathname) === 'archive' : false;
  return (
    <div className="flex flex-col p-4 border-t border-t-default bg-default gap-0.5">
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
        title="Snack"
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
        href="https://blog.expo.dev"
        title="Blog"
        Icon={Certificate02Icon}
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
