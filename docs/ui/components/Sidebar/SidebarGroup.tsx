import { Button, RouterLogo } from '@expo/styleguide';
import {
  Cube01Icon,
  CpuChip01Icon,
  EasMetadataIcon,
  LayersTwo02Icon,
  Rocket01Icon,
  TerminalBrowserIcon,
  EasSubmitIcon,
  Bell03Icon,
  PlanEnterpriseIcon,
  PaletteIcon,
  DataIcon,
  CodeSquare01Icon,
  Phone01Icon,
  CheckIcon,
  StoplightIcon,
} from '@expo/styleguide-icons';

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
  const { chapters, setChapters } = useTutorialChapterCompletion();

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

  // @ts-ignore
  if (route.children?.[0]?.section === 'EAS tutorial') {
    return (
      <div className="mb-5">
        {!shouldSkipTitle(route, parentRoute) && title && (
          <div className="flex flex-row justify-between items-center py-0">
            <SidebarTitle Icon={Icon}>{title}</SidebarTitle>
            <div className="flex flex-row items-center pb-1">
              <CircularProgressBar progress={progressPercentage} />{' '}
              <p className="ml-2 text-secondary text-sm">{`${completedChaptersCount} of ${totalChapters}`}</p>
            </div>
          </div>
        )}
        {(route.children || []).map(child => {
          const childSlug = child.href;
          const completed = isChapterCompleted(childSlug);

          return (
            <div className="flex justify-between items-center" key={`${route.name}-${child.name}`}>
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
            className="w-full flex items-center justify-center"
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
    case 'EAS tutorial':
      return PlanEnterpriseIcon;
    default:
      return undefined;
  }
}
