import { mergeClasses } from '@expo/styleguide';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { BoxLink } from '~/ui/components/BoxLink';
import { P } from '~/ui/components/Text';

import { Checkbox } from '../Form/Checkbox';
import { SuccessCheckmark } from './SuccessCheckmark';
import { TUTORIAL_CHAPTERS, TUTORIAL_TRAILERS, type TutorialName } from './TutorialData';

type ProgressTrackerProps = {
  name: TutorialName;
  currentChapterSlug: string;
  chapterTitle?: string;
  summary?: ReactNode;
  nextChapterTitle?: string;
  nextChapterDescription?: string;
  nextChapterLink?: string;
};

export function ProgressTracker({
  name,
  currentChapterSlug,
  chapterTitle,
  summary,
  nextChapterTitle,
  nextChapterDescription,
  nextChapterLink,
}: ProgressTrackerProps) {
  const intl = useIntl();
  const { isCompleted, setCompleted } = useTutorialChapterCompletion();

  const chapters = TUTORIAL_CHAPTERS[name];
  const currentIndex = chapters.findIndex(chapter => chapter.slug === currentChapterSlug);

  if (currentIndex === -1) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[ProgressTracker] chapter slug "${currentChapterSlug}" not found in ${name}. Update TutorialData.tsx or fix the currentChapterSlug prop.`
      );
    }
    return null;
  }

  const currentChapter = chapters[currentIndex];
  const next = chapters[currentIndex + 1] ?? TUTORIAL_TRAILERS[name];
  const completed = isCompleted(name, currentChapterSlug);

  const handleCheckboxChange = () => {
    setCompleted(name, currentChapterSlug, !completed);
  };

  return (
    <>
      <div className="mx-auto flex w-full flex-col gap-4 rounded-lg border-2 border-palette-gray4 px-4 py-5">
        <SuccessCheckmark
          size="sm"
          className={mergeClasses(
            'mx-auto flex items-center justify-center grayscale transition duration-300',
            completed && 'border-palette-green5 grayscale-0'
          )}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="flex items-center text-center heading-lg text-default">
            <BookOpen02Icon
              aria-hidden="true"
              className="mr-2 size-6! text-icon-secondary max-md:hidden"
            />{' '}
            {chapterTitle ?? currentChapter.title}
          </p>
          <p className="max-w-[60ch] pb-2 text-center leading-normal text-secondary">
            {summary ?? currentChapter.summary}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Checkbox
            id={`chapter-${currentChapterSlug}`}
            checked={completed}
            label={intl.formatMessage({
              id: completed ? 'progressTrackerMarkAsUnread' : 'progressTrackerMarkAsRead',
            })}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>
      <>
        <P className="my-4">{nextChapterDescription ?? currentChapter.nextDescription}</P>
        <BoxLink
          href={nextChapterLink ?? next.slug}
          title={intl.formatMessage(
            { id: 'progressTrackerNext' },
            { title: nextChapterTitle ?? next.title }
          )}
          Icon={BookOpen02Icon}
        />
      </>
    </>
  );
}
