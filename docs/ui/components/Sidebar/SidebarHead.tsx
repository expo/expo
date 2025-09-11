import { DocsLogo, LinkBase, mergeClasses } from '@expo/styleguide';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { BookOpen02DuotoneIcon } from '@expo/styleguide-icons/duotone/BookOpen02DuotoneIcon';
import { GraduationHat02DuotoneIcon } from '@expo/styleguide-icons/duotone/GraduationHat02DuotoneIcon';
import { Home02DuotoneIcon } from '@expo/styleguide-icons/duotone/Home02DuotoneIcon';
import { Stars02DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars02DuotoneIcon';
import { ArrowLeftIcon } from '@expo/styleguide-icons/outline/ArrowLeftIcon';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';

import { ApiVersionSelect } from './ApiVersionSelect';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  const isPreviewVisible = shouldShowFeaturePreviewLink();

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
      <div
        className={mergeClasses(
          'flex flex-col gap-0.5 border-b border-default bg-default p-4',
          'compact-height:pb-3'
        )}>
        <Search />
        <div
          className={mergeClasses(
            'contents',
            'compact-height:grid compact-height:grid-cols-5 compact-height:gap-1',
            isPreviewVisible && 'compact-height:grid-cols-6'
          )}>
          <SidebarSingleEntry
            href="/"
            title="Home"
            Icon={Home02DuotoneIcon}
            isActive={sidebarActiveGroup === 'home'}
            allowCompactDisplay
            mainSection="Home"
          />
          <SidebarSingleEntry
            href="/guides/overview/"
            title="Guides"
            Icon={BookOpen02DuotoneIcon}
            isActive={sidebarActiveGroup === 'general'}
            allowCompactDisplay
            mainSection="Guides"
          />
          <SidebarSingleEntry
            href="/eas/"
            title="EAS"
            Icon={PlanEnterpriseIcon}
            isActive={sidebarActiveGroup === 'eas'}
            allowCompactDisplay
            mainSection="EAS"
          />
          <SidebarSingleEntry
            href="/versions/latest/"
            title="Reference"
            Icon={DocsLogo}
            isActive={sidebarActiveGroup === 'reference'}
            allowCompactDisplay
            mainSection="Reference"
          />
          <SidebarSingleEntry
            href="/tutorial/overview/"
            title="Learn"
            Icon={GraduationHat02DuotoneIcon}
            isActive={sidebarActiveGroup === 'learn'}
            allowCompactDisplay
            mainSection="Learn"
          />
          {isPreviewVisible && (
            <SidebarSingleEntry
              href="/feature-preview/"
              title="Feature Preview"
              Icon={Stars02DuotoneIcon}
              isActive={sidebarActiveGroup === 'featurePreview' || sidebarActiveGroup === 'preview'}
              allowCompactDisplay
            />
          )}
        </div>
      </div>
      <ApiVersionSelect />
    </>
  );
};
