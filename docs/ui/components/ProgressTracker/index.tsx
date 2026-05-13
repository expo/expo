import { mergeClasses } from '@expo/styleguide';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';

import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { BoxLink } from '~/ui/components/BoxLink';
import { P } from '~/ui/components/Text';

import { Checkbox } from '../Form/Checkbox';
import { SuccessCheckmark } from './SuccessCheckmark';
import { TUTORIAL_CHAPTERS, TUTORIAL_TRAILERS, type TutorialName } from './TutorialData';

type ProgressTrackerProps = {
  name: TutorialName;
  currentChapterSlug: string;
};

export function ProgressTracker({ name, currentChapterSlug }: ProgressTrackerProps) {
  const { isCompleted, setCompleted } = useTutorialChapterCompletion();

  const chapters = TUTORIAL_CHAPTERS[name];
  const currentIndex = chapters.findIndex(c => c.slug === currentChapterSlug);

  if (currentIndex === -1) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[ProgressTracker] chapter slug "${currentChapterSlug}" not found in ${name}. ` +
          'Update TutorialData.ts or fix the currentChapterSlug prop.'
      );
    }
    return null;
  }

  const currentChapter = chapters[currentIndex];
  const nextChapter = chapters[currentIndex + 1];
  const nextLink = nextChapter
    ? { title: nextChapter.title, slug: nextChapter.slug }
    : TUTORIAL_TRAILERS[name];

  const completed = isCompleted(name, currentChapterSlug);

  return (
    <>
      <div className="border-palette-gray4 mx-auto flex w-full flex-col gap-4 rounded-lg border-2 px-4 py-5">
        <SuccessCheckmark
          size="sm"
          className={mergeClasses(
            'mx-auto flex items-center justify-center grayscale transition duration-300',
            completed && 'border-palette-green5 grayscale-0'
          )}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-default heading-lg flex items-center text-center">
            <BookOpen02Icon className="text-icon-secondary max-md-gutters:hidden mr-2 size-6!" />{' '}
            {currentChapter.title}
          </p>
          <p className="text-secondary max-w-[60ch] pb-2 text-center leading-normal">
            {currentChapter.summary}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Checkbox
            id={`chapter-${currentChapterSlug}`}
            checked={completed}
            label={completed ? 'Mark this chapter as unread' : 'Mark this chapter as read'}
            onChange={() => {
              setCompleted(name, currentChapterSlug, !completed);
            }}
          />
        </div>
      </div>
      <>
        <P className="my-4">{currentChapter.nextDescription}</P>
        <BoxLink href={nextLink.slug} title={`Next: ${nextLink.title}`} Icon={BookOpen02Icon} />
      </>
    </>
  );
}
