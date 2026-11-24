import { SnackLogo } from '@expo/styleguide';
import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { useRouter } from 'next/compat/router';
import { useIntl } from 'react-intl';

import { getPageSection } from '~/common/routes';

import { SidebarSingleEntry } from './SidebarSingleEntry';
import { ArchiveIcon } from './icons/Archive';

export const SidebarFooter = () => {
  const intl = useIntl();
  const router = useRouter();
  const isArchive = router?.pathname ? getPageSection(router.pathname) === 'archive' : false;
  return (
    <div className="mt-4 flex flex-col gap-0.5 border-t-0.5 border-t-default pt-2.5">
      <SidebarSingleEntry href="/archive" title="Archive" Icon={ArchiveIcon} isActive={isArchive} />
      <SidebarSingleEntry
        href="https://snack.expo.dev"
        title="Expo Snack"
        Icon={SnackLogo}
        isExternal
      />
      <SidebarSingleEntry
        href="https://chat.expo.dev"
        title="Discord and forums"
        Icon={DiscordIcon}
        isExternal
        shouldLeakReferrer
      />
      <SidebarSingleEntry
        href="https://github.com/expo/expo"
        title={intl.formatMessage({ id: 'headerStarOnGitHub' })}
        Icon={GithubIcon}
        isExternal
      />
    </div>
  );
};
