import { SnackLogo } from '@expo/styleguide';
import { ChangelogIcon, DiscordIcon, Mail01Icon } from '@expo/styleguide-icons';
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
        title="Expo Snack"
        Icon={SnackLogo}
        isExternal
      />
      <SidebarSingleEntry
        secondary
        href="https://chat.expo.dev"
        title="Discord and Forums"
        Icon={DiscordIcon}
        isExternal
        shouldLeakReferrer
      />
      <SidebarSingleEntry
        secondary
        href="https://expo.dev/changelog"
        title="Changelog"
        Icon={ChangelogIcon}
        isExternal
      />
      <SidebarSingleEntry
        secondary
        href="https://expo.dev/mailing-list/signup"
        title="Newsletter"
        Icon={Mail01Icon}
        isExternal
      />
    </div>
  );
};
