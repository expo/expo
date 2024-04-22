import { BookOpen02Icon } from '@expo/styleguide-icons';

import { SuccessCheckmark } from './SuccessCheckmark';

import { useLocalStorage } from '~/common/useLocalStorage';
import { reportEasTutorialCompleted } from '~/providers/Analytics';

type Chapter = {
  title: string;
  completed: boolean;
};

type ProgressTrackerProps = {
  currentChapterIndex: number;
  name: string;
  chapterSummary: string;
};

// The following data is for the EAS Tutorial (/tutorial/eas/).
const EAS_TUTORIAL_INITIAL_CHAPTERS: Chapter[] = [
  { title: 'Chapter 1: Configure development build in cloud', completed: false },
  { title: 'Chapter 2: Android development build', completed: false },
  { title: 'Chapter 3: iOS development build for simulators', completed: false },
  { title: 'Chapter 4: Android development build for devices', completed: false },
  { title: 'Chapter 5: Multiple app variants', completed: false },
  { title: 'Chapter 6: Internal distribution build', completed: false },
  { title: 'Chapter 7: Manage app versions', completed: false },
  { title: 'Chapter 8: Android production build', completed: false },
  { title: 'Chapter 9: iOS production build', completed: false },
  { title: 'Chapter 10: Share previews', completed: false },
  { title: 'Chapter 11: Builds from GitHub', completed: false },
];

export function ProgressTracker({
  currentChapterIndex,
  name,
  chapterSummary,
}: ProgressTrackerProps) {
  const [chapters, setChapters] = useLocalStorage<Chapter[]>({
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
    <div className="w-full border border-solid border-default rounded-md p-4 mx-auto mt-6 max-h-80 bg-screen">
      <div className="flex items-center justify-center pt-6">
        <SuccessCheckmark />
      </div>
      {allChaptersCompleted ? (
        <div className="mt-4 text-center text-palette-green10">🎉 All chapters completed!</div>
      ) : (
        currentChapter && (
          <div className="flex items-center justify-center flex-col ">
            {currentChapter && (
              <div className="flex items-center flex-row mt-6">
                <BookOpen02Icon className="size-6" />
                <p className="pl-2 text-center text-default heading-lg font-semibold">
                  {currentChapter.title}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center mt-4 max-w-lg leading-5">
              <p className="text-center text-default pb-2">{chapterSummary}</p>
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
