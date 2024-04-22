import { BookOpen02Icon } from '@expo/styleguide-icons';

import { SuccessCheckmark } from './SuccessCheckmark';
import { EAS_TUTORIAL_INITIAL_CHAPTERS, Chapter } from './TutorialData';

import { useLocalStorage } from '~/common/useLocalStorage';
import { reportEasTutorialCompleted } from '~/providers/Analytics';

type ProgressTrackerProps = {
  currentChapterIndex: number;
  name: string;
  summary: string;
};

export function ProgressTracker({ currentChapterIndex, name, summary }: ProgressTrackerProps) {
  const [chapters] = useLocalStorage<Chapter[]>({
    name,
    defaultValue: name === 'EAS_TUTORIAL' ? EAS_TUTORIAL_INITIAL_CHAPTERS : [],
  });

  // const handleCompleteChapter = () => {
  //   const updatedChapters = chapters.map((chapter, index) =>
  //     index === currentChapterIndex ? { ...chapter, completed: true } : chapter
  //   );
  //   setChapters(updatedChapters);
  // };

  const completedChapters = chapters.filter(chapter => chapter.completed).length;
  // const progressPercentage = (completedChapters / chapters.length) * 100;

  const currentChapter = chapters[currentChapterIndex];
  const allChaptersCompleted = completedChapters === chapters.length;

  if (allChaptersCompleted) {
    reportEasTutorialCompleted();
  }

  return (
    <div className="w-full border border-solid border-default rounded-md p-4 mx-auto mt-6 max-h-96 bg-screen">
      <div className="flex items-center justify-center pt-6">
        <SuccessCheckmark />
      </div>
      {allChaptersCompleted ? (
        <div className="mt-4 text-center text-palette-green10">🎉 All chapters completed!</div>
      ) : (
        currentChapter && (
          <div className="flex items-center justify-center flex-col ">
            {currentChapter && (
              <p className="flex items-center mt-6  text-center text-default heading-lg font-semibold">
                <BookOpen02Icon className="mr-2 size-6" /> {currentChapter.title}
              </p>
            )}
            <div className="flex items-center justify-center mt-2 max-w-lg leading-7">
              <p className="text-center text-default pb-2">{summary}</p>
            </div>
            {/* <div className="self-center text-center mt-3">
              {!currentChapter.completed && (
                <button
                  onClick={handleCompleteChapter}
                  className="px-4 py-2 border border-default text-palette-gray10 dark:text-palette-white rounded-md hover:bg-palette-gray2">
                  Mark this chapter complete?
                </button>
              )}
              {currentChapter.completed && (
                <p className="mt-4 text-center text-palette-black dark:text-palette-white">{`${completedChapters} out of ${chapters.length} chapters completed.`}</p>
              )}
            </div> */}
          </div>
        )
      )}
    </div>
  );
}
