import { DocsLogo, LinkBase } from '@expo/styleguide';
import { BookOpen02DuotoneIcon } from '@expo/styleguide-icons/duotone/BookOpen02DuotoneIcon';
import { GraduationHat02DuotoneIcon } from '@expo/styleguide-icons/duotone/GraduationHat02DuotoneIcon';
import { Home02DuotoneIcon } from '@expo/styleguide-icons/duotone/Home02DuotoneIcon';
import { Stars02DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars02DuotoneIcon';
import { ArrowLeftIcon } from '@expo/styleguide-icons/outline/ArrowLeftIcon';

import { ApiVersionSelect } from './ApiVersionSelect';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  if (sidebarActiveGroup === 'archive') {
    return (
      <div className="flex flex-col gap-0.5 border-b border-default bg-default p-1.5">
        <LinkBase
          href="/"
          className="flex items-center gap-3 rounded-md p-2.5 text-secondary hocus:bg-element">
          <ArrowLeftIcon className="text-icon-secondary" />
          Back
        </LinkBase>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-0.5 border-b border-default bg-default p-4">
        <Search />
        <SidebarSingleEntry
          href="/"
          title="Home"
          Icon={Home02DuotoneIcon}
          isActive={sidebarActiveGroup === 'home'}
        />
        <SidebarSingleEntry
          href="/guides/overview/"
          title="Guides"
          Icon={BookOpen02DuotoneIcon}
          isActive={sidebarActiveGroup === 'general'}
        />
        <SidebarSingleEntry
          href="/versions/latest/"
          title="Reference"
          Icon={DocsLogo}
          isActive={sidebarActiveGroup === 'reference'}
        />
        <SidebarSingleEntry
          href="/tutorial/overview/"
          title="Learn"
          Icon={GraduationHat02DuotoneIcon}
          isActive={sidebarActiveGroup === 'learn'}
        />
        {shouldShowFeaturePreviewLink() && (
          <SidebarSingleEntry
            href="/feature-preview/"
            title="Feature Preview"
            Icon={Stars02DuotoneIcon}
            isActive={sidebarActiveGroup === 'featurePreview' || sidebarActiveGroup === 'preview'}
          />
        )}
      </div>
      <ApiVersionSelect />
    </>
  );
};
