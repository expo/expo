import { Button, RouterLogo } from '@expo/styleguide';
import { EasMetadataIcon } from '@expo/styleguide-icons/custom/EasMetadataIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { StoplightIcon } from '@expo/styleguide-icons/custom/StoplightIcon';
import { PlaySquareDuotoneIcon } from '@expo/styleguide-icons/duotone/PlaySquareDuotoneIcon';
import { ActivityIcon } from '@expo/styleguide-icons/outline/ActivityIcon';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { Cloud01Icon } from '@expo/styleguide-icons/outline/Cloud01Icon';
import { CodeSquare01Icon } from '@expo/styleguide-icons/outline/CodeSquare01Icon';
import { CpuChip01Icon } from '@expo/styleguide-icons/outline/CpuChip01Icon';
import { Cube01Icon } from '@expo/styleguide-icons/outline/Cube01Icon';
import { DataIcon } from '@expo/styleguide-icons/outline/DataIcon';
import { Dataflow03Icon } from '@expo/styleguide-icons/outline/Dataflow03Icon';
import { LayersTwo02Icon } from '@expo/styleguide-icons/outline/LayersTwo02Icon';
import { NotificationBoxIcon } from '@expo/styleguide-icons/outline/NotificationBoxIcon';
import { PaletteIcon } from '@expo/styleguide-icons/outline/PaletteIcon';
import { Phone01Icon } from '@expo/styleguide-icons/outline/Phone01Icon';
import { PlaySquareIcon } from '@expo/styleguide-icons/outline/PlaySquareIcon';
import { PuzzlePiece01Icon } from '@expo/styleguide-icons/outline/PuzzlePiece01Icon';
import { Rocket01Icon } from '@expo/styleguide-icons/outline/Rocket01Icon';
import { Star06Icon } from '@expo/styleguide-icons/outline/Star06Icon';
import { TerminalBrowserIcon } from '@expo/styleguide-icons/outline/TerminalBrowserIcon';
import { useRouter } from 'next/compat/router';
import { useIntl } from 'react-intl';

import {
  buildLocalePath,
  getCanonicalPath,
  getLocaleFromPath,
  hasJapaneseTranslation,
} from '~/common/i18n';
import { isRouteActive } from '~/common/routes';
import { reportEasTutorialCompleted } from '~/providers/Analytics';
import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { NavigationRoute } from '~/types/common';
import { HandWaveIcon } from '~/ui/components/CustomIcons/HandWaveIcon';
import { CircularProgressBar } from '~/ui/components/ProgressTracker/CircularProgressBar';
import { type TutorialName } from '~/ui/components/ProgressTracker/TutorialData';

import { SidebarLink } from './SidebarLink';
import { SidebarSection } from './SidebarSection';
import { SidebarTitle } from './SidebarTitle';
import { SidebarNodeProps } from './types';

export const SidebarGroup = ({ route, parentRoute }: SidebarNodeProps) => {
  const { getChapters, isCompleted, resetTutorial } = useTutorialChapterCompletion();
  const router = useRouter();
  const intl = useIntl();

  const title = route.sidebarTitle ?? route.name;
  const Icon = route.hideIcon ? undefined : getIconElement(route.name);

  const tutorialTracks: Record<
    string,
    {
      name: TutorialName;
      resetHref: string;
      onAllCompleted?: () => void;
    }
  > = {
    'EAS tutorial': {
      name: 'EAS_TUTORIAL',
      resetHref: '/tutorial/eas/introduction/',
      onAllCompleted: reportEasTutorialCompleted,
    },
    'Expo tutorial': {
      name: 'GET_STARTED',
      resetHref: '/tutorial/introduction/',
    },
    'Build with AI tutorial': {
      name: 'BUILD_WITH_AI',
      resetHref: '/tutorial/build-with-ai/introduction/',
    },
    'CI/CD tutorial': {
      name: 'CICD_TUTORIAL',
      resetHref: '/tutorial/cicd/introduction/',
    },
  };
  const tutorialTrack = tutorialTracks[route.name ?? ''];

  if (tutorialTrack && route.children) {
    const { name, resetHref, onAllCompleted } = tutorialTrack;
    const locale = getLocaleFromPath(router?.asPath ?? '/');
    const localizedResetHref =
      locale === 'ja' && hasJapaneseTranslation(resetHref)
        ? buildLocalePath(resetHref, 'ja')
        : resetHref;
    const trackChapters = getChapters(name);
    const totalChapters = trackChapters.length;
    const completedChaptersCount = trackChapters.filter(chapter =>
      isCompleted(name, chapter.slug)
    ).length;
    const allChaptersCompleted = completedChaptersCount === totalChapters;
    const progressPercentage = (completedChaptersCount / totalChapters) * 100;

    if (allChaptersCompleted) {
      onAllCompleted?.();
    }

    const isChapterCompleted = (childSlug: string) => {
      return isCompleted(name, getCanonicalPath(childSlug));
    };

    const handleResetTutorial = () => {
      if (allChaptersCompleted) {
        resetTutorial(name);
      }
    };

    return (
      <div className="mb-5">
        {!shouldSkipTitle(route, parentRoute) && title && (
          <div className="flex flex-row items-center justify-between py-0">
            <SidebarTitle Icon={Icon} sectionName={title}>
              {title}
            </SidebarTitle>
            <div className="flex flex-row items-center pb-1">
              <CircularProgressBar progress={progressPercentage} />{' '}
              <p className="ml-2 text-sm text-tertiary">
                {intl.formatMessage(
                  { id: 'sidebarTutorialProgress' },
                  { completed: completedChaptersCount, total: totalChapters }
                )}
              </p>
            </div>
          </div>
        )}
        {route.children.map(child => {
          const childSlug = child.href;
          const completed = isChapterCompleted(childSlug);
          const isSelected = isRouteActive(child, router?.asPath, router?.pathname);

          return (
            <SidebarLink
              info={{ ...child, hasVideoLink: false }}
              className="flex flex-1"
              key={`${route.name}-${child.name}`}>
              <span className="inline">
                {child.sidebarTitle ?? child.name}
                {child.hasVideoLink &&
                  (!isSelected ? (
                    <PlaySquareIcon
                      aria-hidden="true"
                      className="ml-1 inline icon-xs text-icon-secondary"
                    />
                  ) : (
                    <PlaySquareDuotoneIcon
                      aria-hidden="true"
                      className="ml-1 inline icon-xs text-palette-blue11"
                    />
                  ))}
              </span>
              {completed && <CheckIcon aria-hidden="true" className="ml-auto icon-sm" />}
            </SidebarLink>
          );
        })}
        {allChaptersCompleted && (
          <Button
            onClick={handleResetTutorial}
            theme="secondary"
            className="flex w-full items-center justify-center"
            href={localizedResetHref}>
            {intl.formatMessage({ id: 'sidebarResetTutorial' })}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-5">
      {!shouldSkipTitle(route, parentRoute) && title && (
        <SidebarTitle Icon={Icon} sectionName={title}>
          {title}
        </SidebarTitle>
      )}
      {(route.children ?? []).map(child =>
        child.type === 'page' ? (
          <SidebarLink key={`${route.name}-${child.name}`} info={child}>
            {child.sidebarTitle ?? child.name}
          </SidebarLink>
        ) : (
          <SidebarSection
            key={`group-${child.name}-${route.name}`}
            route={child}
            parentRoute={route}
          />
        )
      )}
    </div>
  );
};

function shouldSkipTitle(info: NavigationRoute, parentGroup?: NavigationRoute) {
  if (info.name === parentGroup?.name) {
    // If the title of the group is Expo SDK and the section within it has the same name
    // then we shouldn't show the title twice. You might want to organize your group like
    // so it is collapsible
    return true;
  } else if (
    info.children &&
    (info.children[0]?.sidebarTitle ?? info.children[0]?.name) === info.name
  ) {
    // If the first child post in the group has the same name as the group, then hide the
    // group title, lest we be very repetitive
    return true;
  }

  return false;
}

function getIconElement(iconName?: string) {
  switch (iconName) {
    case 'AI':
      return Star06Icon;
    case 'Develop':
      return TerminalBrowserIcon;
    case 'Review':
      return StoplightIcon;
    case 'Deploy':
      return Rocket01Icon;
    case 'Monitor':
      return DataIcon;
    case 'Development process':
      return CodeSquare01Icon;
    case 'EAS Build':
      return Cube01Icon;
    case 'EAS Submit':
      return EasSubmitIcon;
    case 'EAS Update':
      return LayersTwo02Icon;
    case 'EAS Metadata':
      return EasMetadataIcon;
    case 'EAS Insights':
      return DataIcon;
    case 'EAS Workflows':
      return Dataflow03Icon;
    case 'EAS Hosting':
      return Cloud01Icon;
    case 'EAS Observe':
      return ActivityIcon;
    case 'Expo Modules API':
      return CpuChip01Icon;
    case 'Expo Router':
      return RouterLogo;
    case 'Push notifications':
      return NotificationBoxIcon;
    case 'Integrations':
      return PuzzlePiece01Icon;
    case 'Distribution':
      return Phone01Icon;
    case 'UI programming':
      return PaletteIcon;
    case 'EAS':
      return PlanEnterpriseIcon;
    case 'Get started':
      return HandWaveIcon;
    case 'Expo tutorial':
      return HandWaveIcon;
    case 'Build with AI tutorial':
      return Star06Icon;
    case 'EAS tutorial':
      return PlanEnterpriseIcon;
    case 'CI/CD tutorial':
      return Dataflow03Icon;
    default:
      return undefined;
  }
}
