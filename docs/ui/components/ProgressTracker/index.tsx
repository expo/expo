import { css } from '@emotion/react';
import { useEffect, useState } from 'react';

type Chapter = {
  id: number;
  title: string;
  completed: boolean;
};

type ProgressTrackerProps = {
  currentChapterIndex: number;
};

const initialChapters: Chapter[] = [
  { id: 1, title: 'Chapter 1', completed: false },
  { id: 2, title: 'Chapter 2', completed: false },
  { id: 3, title: 'Chapter 3', completed: false },
  // { id: 4, title: 'Chapter 4', completed: false },
  // { id: 5, title: 'Chapter 5', completed: false },
];

const STORAGE_KEY = '@expo-docs/useLocalStorage/EAS_TUTORIAL_PROGRESS';

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentChapterIndex }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    const savedChapters = localStorage.getItem(STORAGE_KEY);
    setChapters(savedChapters ? JSON.parse(savedChapters) : initialChapters);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
  }, [chapters]);

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
    <div css={containerStyle}>
      <div css={progressBarContainerStyle}>
        <div css={progressBarStyle(progressPercentage)} />
      </div>
      {allChaptersCompleted ? (
        <div css={completedAllStyle}>🎉 All chapters completed!</div>
      ) : (
        currentChapter && (
          <div>
            {!currentChapter.completed && (
              <button onClick={handleCompleteChapter} css={buttonStyle}>
                Mark {currentChapter.title} as complete?
              </button>
            )}
            {currentChapter.completed && <p css={completedMessageStyle}>Chapter completed!</p>}
          </div>
        )
      )}
    </div>
  );
};

// Emotion CSS styles
const containerStyle = css`
  width: 100%;
  max-width: 600px;
  margin: auto;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
`;

const progressBarContainerStyle = css`
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 10px;
  height: 20px;
`;

const progressBarStyle = (progressPercentage: number) => css`
  background-color: #4caf50;
  height: 100%;
  border-radius: 10px;
  width: ${progressPercentage}%;
`;

const chapterTitleStyle = css`
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
`;

const buttonStyle = css`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const completedMessageStyle = css`
  margin-top: 10px;
  color: green;
`;

const completedAllStyle = css`
  margin-top: 20px;
  font-size: 24px;
  color: #4caf50;
  text-align: center;
`;

export default ProgressTracker;
