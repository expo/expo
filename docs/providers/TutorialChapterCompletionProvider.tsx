import { createContext, useContext, useEffect, useMemo, PropsWithChildren } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';
import {
  type Chapter,
  TUTORIAL_CHAPTERS,
  type TutorialName,
} from '~/ui/components/ProgressTracker/TutorialData';

type CompletionMap = Record<string, boolean>;

type ChapterContextType = {
  getChapters: (name: TutorialName) => Chapter[];
  isCompleted: (name: TutorialName, slug: string) => boolean;
  setCompleted: (name: TutorialName, slug: string, completed: boolean) => void;
  resetTutorial: (name: TutorialName) => void;
};

function migrateLegacyShape(raw: unknown): CompletionMap | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: CompletionMap = {};
  for (const entry of raw) {
    if (entry && typeof entry === 'object' && typeof entry.slug === 'string') {
      out[entry.slug] = !!entry.completed;
    }
  }
  return out;
}

function safeMap(map: CompletionMap | undefined | null): CompletionMap {
  if (!map) {
    return {};
  }
  return migrateLegacyShape(map) ?? map;
}

const defaultValues: ChapterContextType = {
  getChapters: name => TUTORIAL_CHAPTERS[name],
  isCompleted: () => false,
  setCompleted: () => {},
  resetTutorial: () => {},
};

const TutorialChapterCompletionContext = createContext<ChapterContextType>(defaultValues);

export const TutorialChapterCompletionProvider = ({ children }: PropsWithChildren) => {
  const [easMap, setEasMap] = useLocalStorage<CompletionMap>({
    name: 'EAS_TUTORIAL',
    defaultValue: {},
  });
  const [getStartedMap, setGetStartedMap] = useLocalStorage<CompletionMap>({
    name: 'GET_STARTED',
    defaultValue: {},
  });
  const [buildWithAiMap, setBuildWithAiMap] = useLocalStorage<CompletionMap>({
    name: 'BUILD_WITH_AI',
    defaultValue: {},
  });

  useEffect(() => {
    const migrated = migrateLegacyShape(easMap);
    if (migrated) {
      setEasMap(migrated);
    }
  }, [easMap, setEasMap]);

  useEffect(() => {
    const migrated = migrateLegacyShape(getStartedMap);
    if (migrated) {
      setGetStartedMap(migrated);
    }
  }, [getStartedMap, setGetStartedMap]);

  useEffect(() => {
    const migrated = migrateLegacyShape(buildWithAiMap);
    if (migrated) {
      setBuildWithAiMap(migrated);
    }
  }, [buildWithAiMap, setBuildWithAiMap]);

  const value = useMemo<ChapterContextType>(() => {
    const maps: Record<TutorialName, CompletionMap> = {
      EAS_TUTORIAL: safeMap(easMap),
      GET_STARTED: safeMap(getStartedMap),
      BUILD_WITH_AI: safeMap(buildWithAiMap),
    };
    const setters: Record<TutorialName, (next: CompletionMap) => void> = {
      EAS_TUTORIAL: setEasMap,
      GET_STARTED: setGetStartedMap,
      BUILD_WITH_AI: setBuildWithAiMap,
    };
    return {
      getChapters: name => TUTORIAL_CHAPTERS[name],
      isCompleted: (name, slug) => !!maps[name][slug],
      setCompleted: (name, slug, completed) => {
        setters[name]({ ...maps[name], [slug]: completed });
      },
      resetTutorial: name => {
        setters[name]({});
      },
    };
  }, [easMap, getStartedMap, buildWithAiMap, setEasMap, setGetStartedMap, setBuildWithAiMap]);

  return (
    <TutorialChapterCompletionContext.Provider value={value}>
      {children}
    </TutorialChapterCompletionContext.Provider>
  );
};

export const useTutorialChapterCompletion = () => useContext(TutorialChapterCompletionContext);
