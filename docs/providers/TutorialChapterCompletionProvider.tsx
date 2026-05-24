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

function safeMap(m: CompletionMap | undefined | null): CompletionMap {
  if (!m) {
    return {};
  }
  return migrateLegacyShape(m) ?? m;
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
  const [cicdMap, setCicdMap] = useLocalStorage<CompletionMap>({
    name: 'CICD_TUTORIAL',
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
    const migrated = migrateLegacyShape(cicdMap);
    if (migrated) {
      setCicdMap(migrated);
    }
  }, [cicdMap, setCicdMap]);

  const value = useMemo<ChapterContextType>(() => {
    const maps: Record<TutorialName, CompletionMap> = {
      EAS_TUTORIAL: safeMap(easMap),
      GET_STARTED: safeMap(getStartedMap),
      CICD_TUTORIAL: safeMap(cicdMap),
    };
    const setters: Record<TutorialName, (next: CompletionMap) => void> = {
      EAS_TUTORIAL: setEasMap,
      GET_STARTED: setGetStartedMap,
      CICD_TUTORIAL: setCicdMap,
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
  }, [easMap, getStartedMap, cicdMap, setEasMap, setGetStartedMap, setCicdMap]);

  return (
    <TutorialChapterCompletionContext.Provider value={value}>
      {children}
    </TutorialChapterCompletionContext.Provider>
  );
};

export const useTutorialChapterCompletion = () => useContext(TutorialChapterCompletionContext);
