import { Button } from '@expo/styleguide';
import { PlaySquareDuotoneIcon } from '@expo/styleguide-icons/duotone/PlaySquareDuotoneIcon';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { PlaySquareIcon } from '@expo/styleguide-icons/outline/PlaySquareIcon';
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

  const tutorialTracks: Record<
    string,
    {
      name: TutorialName;
      resetHref: string;
      onAllCompleted?: () => void;
    }
  > = {
    'Expo Services tutorial': {
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
      <div className="mb-4 flex flex-col gap-0.5">
        {!shouldSkipTitle(route, parentRoute) && title && (
          <SidebarTitle
            sectionName={title}
            trailing={
              <div className="flex shrink-0 items-center gap-1">
                <p className="text-[10px] leading-none font-medium tracking-[-0.5px] whitespace-nowrap text-quaternary">
                  {intl.formatMessage(
                    { id: 'sidebarTutorialProgress' },
                    { completed: completedChaptersCount, total: totalChapters }
                  )}
                </p>
                <CircularProgressBar progress={progressPercentage} />
              </div>
            }>
            {title}
          </SidebarTitle>
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
                      className="ml-1 inline icon-sm text-icon-secondary"
                    />
                  ) : (
                    <PlaySquareDuotoneIcon
                      aria-hidden="true"
                      className="ml-1 inline icon-sm text-palette-blue11"
                    />
                  ))}
              </span>
              {completed && <CheckIcon aria-hidden="true" className="icon-sm shrink-0" />}
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
    <div className="mb-4 flex flex-col gap-0.5">
      {!shouldSkipTitle(route, parentRoute) && title && (
        <SidebarTitle sectionName={title}>{title}</SidebarTitle>
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
