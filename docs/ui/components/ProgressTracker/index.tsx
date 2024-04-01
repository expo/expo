import { useLocalStorage } from '~/common/useLocalStorage';

type Chapter = {
  id: number;
  completed: boolean;
};

type ProgressTrackerProps = {
  currentChapterIndex: number;
};

const initialChapters: Chapter[] = [
  { id: 1, completed: false },
  { id: 2, completed: false },
  { id: 3, completed: false },
  { id: 4, completed: false },
  { id: 5, completed: false },
  { id: 6, completed: false },
  { id: 7, completed: false },
  { id: 8, completed: false },
  { id: 9, completed: false },
  { id: 10, completed: false },
  { id: 11, completed: false },
];

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentChapterIndex }) => {
  const [chapters, setChapters] = useLocalStorage<Chapter[]>({
    name: 'EAS_TUTORIAL_PROGRESS',
    defaultValue: initialChapters,
  });

  const handleCompleteChapter = () => {
    const updatedChapters = chapters.map((chapter, index) =>
      index === currentChapterIndex ? { ...chapter, completed: true } : chapter
    );
    setChapters(updatedChapters);
  };

  const completedChapters = chapters.filter(chapter => chapter.completed).length;
  const progressPercentage = (completedChapters / chapters.length) * 100;

  const currentChapter = chapters[currentChapterIndex];
  const allChaptersCompleted = completedChapters === chapters.length;

  return (
    <div className="w-full border border-solid border-default rounded-md p-4 mx-auto mt-6">
      <div className="w-full bg-palette-gray6 rounded-full h-2">
        <div
          className="bg-palette-green10 h-2 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {allChaptersCompleted ? (
        <div className="mt-4 text-center text-palette-green10">🎉 All chapters completed!</div>
      ) : (
        currentChapter && (
          <div>
            <div className="self-center text-center mt-3">
              {!currentChapter.completed && (
                <button
                  onClick={handleCompleteChapter}
                  className="px-4 py-2 border border-default text-palette-gray10 dark:text-palette-white rounded-md hover:bg-palette-gray2">
                  Mark this chapter complete?
                </button>
              )}
              {currentChapter.completed && (
                <p className="mt-2 text-center text-palette-black dark:text-palette-white">{`${completedChapters} out of ${chapters.length} chapters completed.`}</p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ProgressTracker;
