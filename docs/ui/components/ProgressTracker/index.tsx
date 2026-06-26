import { mergeClasses } from '@expo/styleguide';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';
import { useIntl } from 'react-intl';

import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { BoxLink } from '~/ui/components/BoxLink';
import { P } from '~/ui/components/Text';

import { Checkbox } from '../Form/Checkbox';
import { SuccessCheckmark } from './SuccessCheckmark';
import { Chapter } from './TutorialData';

type ProgressTrackerProps = {
  currentChapterIndex: number;
  name: string;
  summary: string;
  chapterTitle?: string;
  nextChapterTitle?: string;
  nextChapterDescription?: string;
  nextChapterLink?: string;
};

export function ProgressTracker({
  currentChapterIndex,
  name,
  summary,
  chapterTitle,
  nextChapterTitle,
  nextChapterDescription,
  nextChapterLink,
}: ProgressTrackerProps) {
  const intl = useIntl();
  const {
    chapters,
    setChapters,
    getStartedChapters,
    setGetStartedChapters,
    buildWithAiChapters,
    setBuildWithAiChapters,
  } = useTutorialChapterCompletion();

  const tracks: Record<string, [Chapter[], (chapters: Chapter[]) => void]> = {
    EAS_TUTORIAL: [chapters, setChapters],
    GET_STARTED: [getStartedChapters, setGetStartedChapters],
    BUILD_WITH_AI: [buildWithAiChapters, setBuildWithAiChapters],
  };
  const [trackChapters, setTrackChapters] = tracks[name] ?? tracks.EAS_TUTORIAL;
  const currentChapter = trackChapters[currentChapterIndex];

  const handleCheckboxChange = () => {
    const updatedChapters = trackChapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: !currentChapter.completed };
      }
      return chapter;
    });
    setTrackChapters(updatedChapters);
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
          <p className="flex items-center text-center heading-lg text-default">
            <BookOpen02Icon
              aria-hidden="true"
              className="mr-2 size-6! text-icon-secondary max-md:hidden"
            />{' '}
            {chapterTitle ?? currentChapter.title}
          </p>
          <p className="max-w-[60ch] pb-2 text-center leading-normal text-secondary">{summary}</p>
        </div>
        <div className="flex items-center justify-center">
          <Checkbox
            id={`chapter-${currentChapterIndex}`}
            checked={currentChapter.completed}
            label={intl.formatMessage({
              id: currentChapter.completed
                ? 'progressTrackerMarkAsUnread'
                : 'progressTrackerMarkAsRead',
            })}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>
      <>
        <P className="my-4">{nextChapterDescription}</P>
        <BoxLink
          href={nextChapterLink}
          title={intl.formatMessage(
            { id: 'progressTrackerNext' },
            { title: nextChapterTitle ?? '' }
          )}
          Icon={BookOpen02Icon}
        />
      </>
    </>
  );
}
