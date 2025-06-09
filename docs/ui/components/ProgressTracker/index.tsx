import { mergeClasses } from '@expo/styleguide';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';

import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { BoxLink } from '~/ui/components/BoxLink';
import { P } from '~/ui/components/Text';

import { SuccessCheckmark } from './SuccessCheckmark';
import { Chapter } from './TutorialData';
import { Checkbox } from '../Form/Checkbox';

type ProgressTrackerProps = {
  currentChapterIndex: number;
  name: string;
  summary: string;
  nextChapterTitle?: string;
  nextChapterDescription?: string;
  nextChapterLink?: string;
};

export function ProgressTracker({
  currentChapterIndex,
  name,
  summary,
  nextChapterTitle,
  nextChapterDescription,
  nextChapterLink,
}: ProgressTrackerProps) {
  const { chapters, setChapters, getStartedChapters, setGetStartedChapters } =
    useTutorialChapterCompletion();
  const isGetStartedTutorial = name === 'GET_STARTED';
  const currentChapter = isGetStartedTutorial
    ? getStartedChapters[currentChapterIndex]
    : chapters[currentChapterIndex];

  const handleChapterComplete = () => {
    const updatedChapters = chapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  const handleGetStartedChapterComplete = () => {
    const updatedChapters = getStartedChapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setGetStartedChapters(updatedChapters);
  };

  const handleChapterIncomplete = () => {
    const updatedChapters = chapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: false };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  const handleGetStartedChapterIncomplete = () => {
    const updatedChapters = getStartedChapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: false };
      }
      return chapter;
    });
    setGetStartedChapters(updatedChapters);
  };

  const handleCheckboxChange = () => {
    if (currentChapter.completed) {
      handleChapterIncomplete();
    } else {
      handleChapterComplete();
    }
  };

  const handleCheckboxChangeForGetStarted = () => {
    if (currentChapter.completed) {
      handleGetStartedChapterIncomplete();
    } else {
      handleGetStartedChapterComplete();
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col gap-4 rounded-lg border-2 border-palette-gray4 px-4 py-5">
        <SuccessCheckmark
          size="sm"
          className={mergeClasses(
            'mx-auto flex items-center justify-center grayscale transition duration-300',
            currentChapter.completed && 'border-palette-green5 grayscale-0'
          )}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="flex items-center text-center font-semibold text-default heading-lg">
            <BookOpen02Icon className="mr-2 size-6 text-icon-secondary max-md-gutters:hidden" />{' '}
            {currentChapter.title}
          </p>
          <p className="max-w-[60ch] pb-2 text-center leading-normal text-secondary">{summary}</p>
        </div>
        <div className="flex items-center justify-center">
          <Checkbox
            id={`chapter-${currentChapterIndex}`}
            checked={currentChapter.completed}
            label={
              currentChapter.completed ? 'Mark this chapter as unread' : 'Mark this chapter as read'
            }
            onChange={
              isGetStartedTutorial ? handleCheckboxChangeForGetStarted : handleCheckboxChange
            }
          />
        </div>
      </div>
      <>
        <P className="my-4">{nextChapterDescription}</P>
        <BoxLink href={nextChapterLink} title={`Next: ${nextChapterTitle}`} Icon={BookOpen02Icon} />
      </>
    </>
  );
}
