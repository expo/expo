import { createContext, useContext, PropsWithChildren } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';
import {
  EAS_TUTORIAL_INITIAL_CHAPTERS,
  GET_STARTED_TUTORIAL_CHAPTERS,
  Chapter,
} from '~/ui/components/ProgressTracker/TutorialData';

type ChapterContextType = {
  chapters: Chapter[];
  setChapters: (chapters: Chapter[]) => void;
  getStartedChapters: Chapter[];
  setGetStartedChapters: (chapters: Chapter[]) => void;
};

// Provide initial values matching the type
const defaultValues: ChapterContextType = {
  chapters: [],
  setChapters: () => {},
  getStartedChapters: [],
  setGetStartedChapters: () => {},
};

const TutorialChapterCompletionContext = createContext<ChapterContextType>(defaultValues);

export const TutorialChapterCompletionProvider = ({ children }: PropsWithChildren) => {
  const [chapters, setChapters] = useLocalStorage<Chapter[]>({
    name: 'EAS_TUTORIAL',
    defaultValue: EAS_TUTORIAL_INITIAL_CHAPTERS,
  });

  const [getStartedChapters, setGetStartedChapters] = useLocalStorage<Chapter[]>({
    name: 'GET_STARTED',
    defaultValue: GET_STARTED_TUTORIAL_CHAPTERS,
  });

  return (
    <TutorialChapterCompletionContext.Provider
      value={{ chapters, setChapters, getStartedChapters, setGetStartedChapters }}>
      {children}
    </TutorialChapterCompletionContext.Provider>
  );
};

export const useTutorialChapterCompletion = () => useContext(TutorialChapterCompletionContext);
