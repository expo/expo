import { BookOpen02Icon, ArrowRightIcon } from '@expo/styleguide-icons';

import { SuccessCheckmark } from './SuccessCheckmark';
import { EAS_TUTORIAL_INITIAL_CHAPTERS, Chapter } from './TutorialData';

import { useLocalStorage } from '~/common/useLocalStorage';
import { reportEasTutorialCompleted } from '~/providers/Analytics';
import { H2, P, A, DEMI } from '~/ui/components/Text';

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
  const [chapters, setChapters] = useLocalStorage<Chapter[]>({
    name,
    defaultValue: name === 'EAS_TUTORIAL' ? EAS_TUTORIAL_INITIAL_CHAPTERS : [],
  });

  const handleCompleteChapter = () => {
    const updatedChapters = chapters.map((chapter, index) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  // const completedChapters = chapters.filter(chapter => chapter.completed).length;
  // const progressPercentage = (completedChapters / chapters.length) * 100;

  const currentChapter = chapters[currentChapterIndex];
  // const allChaptersCompleted = completedChapters === chapters.length;

  // TODO: Move this code SidebarGroup.tsx
  // if (allChaptersCompleted) {
  //   reportEasTutorialCompleted();
  // }

  return (
    <>
      <div className="w-full border border-solid border-default rounded-md p-4 mx-auto mt-6 max-h-96 bg-screen">
        <div className="flex items-center justify-center pt-6">
          <SuccessCheckmark />
        </div>
        {currentChapter && (
          <div className="flex items-center justify-center flex-col ">
            {currentChapter && (
              <p className="flex items-center mt-6  text-center text-default heading-lg font-semibold">
                <BookOpen02Icon className="mr-2 size-6" /> {currentChapter.title}
              </p>
            )}
            <div className="flex items-center justify-center mt-2 max-w-lg leading-7">
              <p className="text-center text-default pb-2">{summary}</p>
            </div>
          </div>
        )}
      </div>
      <>
        <P className="my-4">{nextChapterDescription}</P>
        <A
          onClick={handleCompleteChapter}
          href={nextChapterLink}
          className="flex flex-row justify-between border border-solid border-default rounded-md py-3 px-4 mb-3 hocus:shadow-xs"
          isStyled>
          <div className="flex flex-row gap-4 items-center">
            <div className="flex bg-element rounded-md self-center items-center justify-center min-w-[36px] h-9">
              <BookOpen02Icon className="icon-lg text-icon-default" />
            </div>
            <div>
              <DEMI>Next chapter: {nextChapterTitle}</DEMI>
            </div>
          </div>
          <ArrowRightIcon className="text-icon-secondary self-center content-end ml-3 min-w-[20px]" />
        </A>
      </>
    </>
  );
}
