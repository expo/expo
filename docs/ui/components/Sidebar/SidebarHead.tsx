import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowLeftIcon } from '@expo/styleguide-icons/outline/ArrowLeftIcon';
import { BookOpen01Icon } from '@expo/styleguide-icons/outline/BookOpen01Icon';
import { GraduationHat02Icon } from '@expo/styleguide-icons/outline/GraduationHat02Icon';
import { Home02Icon } from '@expo/styleguide-icons/outline/Home02Icon';
import { Stars02Icon } from '@expo/styleguide-icons/outline/Stars02Icon';
import { useIntl } from 'react-intl';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { LanguageSwitcher } from '~/ui/components/Header/LanguageSwitcher';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';

import { ApiVersionSelect, SIDEBAR_SELECT_CLASS_NAME } from './ApiVersionSelect';
import { ExpoServicesIcon } from './icons/ExpoServices';
import { ReferencesIcon } from './icons/References';

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
    eas: easLabel,
    reference: referenceLabel,
    learn: learnLabel,
  };
  const mainSection = mainSectionMap[sidebarActiveGroup];

  if (sidebarActiveGroup === 'archive') {
    return (
      <div className="flex flex-col gap-0.5 border-b border-default bg-default p-1.5">
        <LinkBase
          href="/"
          className="flex items-center gap-3 rounded-lg p-2.5 text-secondary hocus:bg-element">
          <ArrowLeftIcon aria-hidden="true" className="text-icon-secondary" />
          Back
        </LinkBase>
      </div>
    );
  }

  return (
    <>
      <div
        className={mergeClasses(
          'flex flex-col gap-2.5',
          'max-lg:border-b max-lg:border-default max-lg:bg-default max-lg:p-4'
        )}>
        <Search mainSection={mainSection} />
        <div
          className={mergeClasses(
            'flex flex-col gap-0.5 pb-2.5',
            'lg:border-b-[0.5px] lg:border-default',
            'compact-height:grid compact-height:grid-cols-5 compact-height:gap-1',
            isPreviewVisible && 'compact-height:grid-cols-6'
          )}>
          <SidebarSingleEntry
            href="/"
            title={homeLabel}
            Icon={Home02Icon}
            isActive={sidebarActiveGroup === 'home'}
            allowCompactDisplay
            mainSection={homeLabel}
          />
          <SidebarSingleEntry
            href="/guides/overview/"
            title={guidesLabel}
            Icon={BookOpen01Icon}
            isActive={sidebarActiveGroup === 'general'}
            allowCompactDisplay
            mainSection={guidesLabel}
          />
          <SidebarSingleEntry
            href="/eas/"
            title={easLabel}
            Icon={ExpoServicesIcon}
            isActive={sidebarActiveGroup === 'eas'}
            allowCompactDisplay
            mainSection={easLabel}
          />
          <SidebarSingleEntry
            href="/versions/latest/"
            title={intl.formatMessage({ id: 'navReferences' })}
            Icon={ReferencesIcon}
            isActive={sidebarActiveGroup === 'reference'}
            allowCompactDisplay
            mainSection={referenceLabel}
          />
          <SidebarSingleEntry
            href="/tutorial/overview/"
            title={learnLabel}
            Icon={GraduationHat02Icon}
            isActive={sidebarActiveGroup === 'learn'}
            allowCompactDisplay
            mainSection={learnLabel}
          />
          {isPreviewVisible && (
            <SidebarSingleEntry
              href="/feature-preview/"
              title="Feature preview"
              Icon={Stars02Icon}
              isActive={sidebarActiveGroup === 'featurePreview' || sidebarActiveGroup === 'preview'}
              allowCompactDisplay
            />
          )}
        </div>
      </div>
      <ApiVersionSelect />
      <div className="empty:hidden lg:mt-4 max-lg:hidden">
        <LanguageSwitcher className={SIDEBAR_SELECT_CLASS_NAME} />
      </div>
    </>
  );
};
