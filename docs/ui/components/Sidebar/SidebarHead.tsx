import { DocsLogo, LinkBase, mergeClasses } from '@expo/styleguide';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { BookOpen02DuotoneIcon } from '@expo/styleguide-icons/duotone/BookOpen02DuotoneIcon';
import { GraduationHat02DuotoneIcon } from '@expo/styleguide-icons/duotone/GraduationHat02DuotoneIcon';
import { Home02DuotoneIcon } from '@expo/styleguide-icons/duotone/Home02DuotoneIcon';
import { Stars02DuotoneIcon } from '@expo/styleguide-icons/duotone/Stars02DuotoneIcon';
import { ArrowLeftIcon } from '@expo/styleguide-icons/outline/ArrowLeftIcon';
import { useIntl } from 'react-intl';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';

import { ApiVersionSelect } from './ApiVersionSelect';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  const intl = useIntl();
  const isPreviewVisible = shouldShowFeaturePreviewLink();
  const homeLabel = intl.formatMessage({ id: 'navHome' });
  const guidesLabel = intl.formatMessage({ id: 'navGuides' });
  const easLabel = intl.formatMessage({ id: 'navEas' });
  const referenceLabel = intl.formatMessage({ id: 'navReference' });
  const learnLabel = intl.formatMessage({ id: 'navLearn' });
  const mainSectionMap: Record<string, string> = {
    home: homeLabel,
    general: guidesLabel,
    eas: 'Expo Application Services',
    reference: referenceLabel,
    learn: learnLabel,
  };
  const mainSection = mainSectionMap[sidebarActiveGroup];

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
      <div className="flex flex-col gap-0.5 border-b border-default bg-default p-4 compact-height:pb-3">
        <Search mainSection={mainSection} />
        <div
          className={mergeClasses(
            'contents',
            'compact-height:grid compact-height:grid-cols-5 compact-height:gap-1',
            isPreviewVisible && 'compact-height:grid-cols-6'
          )}>
          <SidebarSingleEntry
            href="/"
            title={homeLabel}
            Icon={Home02DuotoneIcon}
            isActive={sidebarActiveGroup === 'home'}
            allowCompactDisplay
            mainSection={homeLabel}
          />
          <SidebarSingleEntry
            href="/guides/overview/"
            title={guidesLabel}
            Icon={BookOpen02DuotoneIcon}
            isActive={sidebarActiveGroup === 'general'}
            allowCompactDisplay
            mainSection={guidesLabel}
          />
          <SidebarSingleEntry
            href="/eas/"
            title={easLabel}
            Icon={PlanEnterpriseIcon}
            isActive={sidebarActiveGroup === 'eas'}
            allowCompactDisplay
            mainSection={easLabel}
          />
          <SidebarSingleEntry
            href="/versions/latest/"
            title={referenceLabel}
            Icon={DocsLogo}
            isActive={sidebarActiveGroup === 'reference'}
            allowCompactDisplay
            mainSection={referenceLabel}
          />
          <SidebarSingleEntry
            href="/tutorial/overview/"
            title={learnLabel}
            Icon={GraduationHat02DuotoneIcon}
            isActive={sidebarActiveGroup === 'learn'}
            allowCompactDisplay
            mainSection={learnLabel}
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
