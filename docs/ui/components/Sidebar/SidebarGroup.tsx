import { Button, RouterLogo } from '@expo/styleguide';
import { EasMetadataIcon } from '@expo/styleguide-icons/custom/EasMetadataIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { StoplightIcon } from '@expo/styleguide-icons/custom/StoplightIcon';
import { Bell03Icon } from '@expo/styleguide-icons/outline/Bell03Icon';
import { CheckIcon } from '@expo/styleguide-icons/outline/CheckIcon';
import { CodeSquare01Icon } from '@expo/styleguide-icons/outline/CodeSquare01Icon';
import { CpuChip01Icon } from '@expo/styleguide-icons/outline/CpuChip01Icon';
import { Cube01Icon } from '@expo/styleguide-icons/outline/Cube01Icon';
import { DataIcon } from '@expo/styleguide-icons/outline/DataIcon';
import { LayersTwo02Icon } from '@expo/styleguide-icons/outline/LayersTwo02Icon';
import { PaletteIcon } from '@expo/styleguide-icons/outline/PaletteIcon';
import { Phone01Icon } from '@expo/styleguide-icons/outline/Phone01Icon';
import { Rocket01Icon } from '@expo/styleguide-icons/outline/Rocket01Icon';
import { TerminalBrowserIcon } from '@expo/styleguide-icons/outline/TerminalBrowserIcon';

import { SidebarNodeProps } from './Sidebar';
import { SidebarTitle, SidebarLink, SidebarSection } from './index';

import { reportEasTutorialCompleted } from '~/providers/Analytics';
import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { NavigationRoute } from '~/types/common';
import { HandWaveIcon } from '~/ui/components/CustomIcons/HandWaveIcon';
import { CircularProgressBar } from '~/ui/components/ProgressTracker/CircularProgressBar';
import { Chapter } from '~/ui/components/ProgressTracker/TutorialData';

export const SidebarGroup = ({ route, parentRoute }: SidebarNodeProps) => {
  const title = route.sidebarTitle ?? route.name;
  const Icon = getIconElement(title);
  const { chapters, setChapters, getStartedChapters, setGetStartedChapters } =
    useTutorialChapterCompletion();

  const allChaptersCompleted = chapters.every((chapter: Chapter) => chapter.completed);
  const completedChaptersCount = chapters.filter((chapter: Chapter) => chapter.completed).length;
  const isChapterCompleted = (childSlug: string) => {
    const isCompleted = chapters.some(
      (chapter: Chapter) => chapter.slug === childSlug && chapter.completed
    );
    return isCompleted;
  };
  const totalChapters = chapters.length;
  const progressPercentage = (completedChaptersCount / totalChapters) * 100;

  if (allChaptersCompleted) {
    reportEasTutorialCompleted();
  }

  const resetTutorial = () => {
    if (allChaptersCompleted) {
      const resetChapters = chapters.map((chapter: Chapter) => ({ ...chapter, completed: false }));
      setChapters(resetChapters);
    }
  };

  const allGetStartedChaptersCompleted = getStartedChapters.every(
    (chapter: Chapter) => chapter.completed
  );
  const completedGetStartedChaptersCount = getStartedChapters.filter(
    (chapter: Chapter) => chapter.completed
  ).length;
  const isGetStartedChapterCompleted = (childSlug: string) => {
    const isCompleted = getStartedChapters.some(
      (chapter: Chapter) => chapter.slug === childSlug && chapter.completed
    );
    return isCompleted;
  };
  const totalGetStartedChapters = getStartedChapters.length;
  const progressPercentageForGetStarted =
    (completedGetStartedChaptersCount / totalGetStartedChapters) * 100;

  const resetGetStartedTutorial = () => {
    if (allGetStartedChaptersCompleted) {
      const resetChapters = getStartedChapters.map((chapter: Chapter) => ({
        ...chapter,
        completed: false,
      }));
      setGetStartedChapters(resetChapters);
    }
  };

  // @ts-ignore
  if (route.children?.[0]?.section === 'EAS tutorial') {
    return (
      <div className="mb-5">
        {!shouldSkipTitle(route, parentRoute) && title && (
          <div className="flex flex-row items-center justify-between py-0">
            <SidebarTitle Icon={Icon}>{title}</SidebarTitle>
            <div className="flex flex-row items-center pb-1">
              <CircularProgressBar progress={progressPercentage} />{' '}
              <p className="ml-2 text-sm text-secondary">{`${completedChaptersCount} of ${totalChapters}`}</p>
            </div>
          </div>
        )}
        {(route.children || []).map(child => {
          const childSlug = child.href;
          const completed = isChapterCompleted(childSlug);

          return (
            <div className="flex items-center justify-between" key={`${route.name}-${child.name}`}>
              <div className="flex-1">
                <SidebarLink info={child}>{child.sidebarTitle || child.name}</SidebarLink>
              </div>
              {completed && <CheckIcon className="size-4" />}
            </div>
          );
        })}
        {allChaptersCompleted && (
          <Button
            onClick={resetTutorial}
            theme="secondary"
            className="flex w-full items-center justify-center"
            href="/tutorial/eas/introduction/">
            Reset tutorial
          </Button>
        )}
      </div>
    );
  }

  // @ts-ignore
  if (route.children?.[0]?.section === 'Expo tutorial') {
    return (
      <div className="mb-5">
        {!shouldSkipTitle(route, parentRoute) && title && (
          <div className="flex flex-row items-center justify-between py-0">
            <SidebarTitle Icon={Icon}>{title}</SidebarTitle>
            <div className="flex flex-row items-center pb-1">
              <CircularProgressBar progress={progressPercentageForGetStarted} />{' '}
              <p className="ml-2 text-sm text-secondary">{`${completedGetStartedChaptersCount} of ${totalGetStartedChapters}`}</p>
            </div>
          </div>
        )}
        {(route.children || []).map(child => {
          const childSlug = child.href;
          const completed = isGetStartedChapterCompleted(childSlug);

          return (
            <div className="flex items-center justify-between" key={`${route.name}-${child.name}`}>
              <div className="flex-1">
                <SidebarLink info={child}>{child.sidebarTitle || child.name}</SidebarLink>
              </div>
              {completed && <CheckIcon className="size-4" />}
            </div>
          );
        })}
        {allGetStartedChaptersCompleted && (
          <Button
            onClick={resetGetStartedTutorial}
            theme="secondary"
            className="flex w-full items-center justify-center"
            href="/tutorial/eas/introduction/">
            Reset tutorial
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-5">
      {!shouldSkipTitle(route, parentRoute) && title && (
        <SidebarTitle Icon={Icon}>{title}</SidebarTitle>
      )}
      {(route.children || []).map(child =>
        child.type === 'page' ? (
          <SidebarLink key={`${route.name}-${child.name}`} info={child}>
            {child.sidebarTitle || child.name}
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
    ((info.children[0] || {}).sidebarTitle || (info.children[0] || {}).name) === info.name
  ) {
    // If the first child post in the group has the same name as the group, then hide the
    // group title, lest we be very repetitive
    return true;
  }

  return false;
}

function getIconElement(iconName?: string) {
  switch (iconName) {
    case 'Develop':
      return TerminalBrowserIcon;
    case 'Review':
      return StoplightIcon;
    case 'Deploy':
      return Rocket01Icon;
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
    case 'Expo Modules API':
      return CpuChip01Icon;
    case 'Expo Router':
      return RouterLogo;
    case 'Push notifications':
      return Bell03Icon;
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
    case 'EAS tutorial':
      return PlanEnterpriseIcon;
    default:
      return undefined;
  }
}
