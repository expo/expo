import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';
import React from 'react';

import { SuccessCheckmark } from './SuccessCheckmark';
import { Chapter } from './TutorialData';
import { Checkbox } from '../Form/Checkbox';

import { useTutorialChapterCompletion } from '~/providers/TutorialChapterCompletionProvider';
import { P, A, DEMI } from '~/ui/components/Text';

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
  const { chapters, setChapters, getStartedChapters, setGetStartedChapters } =
    useTutorialChapterCompletion();
  const isGetStartedTutorial = name === 'GET_STARTED';
  const currentChapter = isGetStartedTutorial
    ? getStartedChapters[currentChapterIndex]
    : chapters[currentChapterIndex];

  const handleChapterComplete = () => {
    const updatedChapters = chapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  const handleGetStartedChapterComplete = () => {
    const updatedChapters = getStartedChapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setGetStartedChapters(updatedChapters);
  };

  const handleChapterIncomplete = () => {
    const updatedChapters = chapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: false };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  const handleGetStartedChapterIncomplete = () => {
    const updatedChapters = getStartedChapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: false };
      }
      return chapter;
    });
    setGetStartedChapters(updatedChapters);
  };

  const handleCheckboxChange = () => {
    if (currentChapter.completed) {
      handleChapterIncomplete();
    } else {
      handleChapterComplete();
    }
  };

  const handleCheckboxChangeForGetStarted = () => {
    if (currentChapter.completed) {
      handleGetStartedChapterIncomplete();
    } else {
      handleGetStartedChapterComplete();
    }
  };

  return (
    <>
      <div className="mx-auto mt-6 max-h-96 w-full rounded-md border border-solid border-default bg-subtle p-3">
        <div className="flex items-center justify-center pt-2">
          <SuccessCheckmark />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="mt-6 flex items-center text-center font-semibold text-default heading-lg">
            <BookOpen02Icon className="mr-2 size-6" /> {currentChapter.title}
          </p>
          <div className="mt-2 flex max-w-lg items-center justify-center leading-7">
            <p className="pb-2 text-center text-default">{summary}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <Checkbox
            id={`chapter-${currentChapterIndex}`}
            checked={currentChapter.completed}
            label={
              currentChapter.completed ? 'Mark this chapter as unread' : 'Mark this chapter as read'
            }
            onChange={
              isGetStartedTutorial ? handleCheckboxChangeForGetStarted : handleCheckboxChange
            }
          />
        </div>
      </div>
      <>
        <P className="my-4">{nextChapterDescription}</P>
        <A
          href={nextChapterLink}
          className="mb-3 flex flex-row justify-between rounded-md border border-solid border-default px-4 py-3 hocus:shadow-xs"
          isStyled>
          <div className="flex flex-row items-center gap-4">
            <div className="flex h-9 min-w-[36px] items-center justify-center self-center rounded-md bg-element">
              <BookOpen02Icon className="icon-lg text-icon-default" />
            </div>
            <div>
              <DEMI>Next: {nextChapterTitle}</DEMI>
            </div>
          </div>
          <ArrowRightIcon className="ml-3 min-w-[20px] content-end self-center text-icon-secondary" />
        </A>
      </>
    </>
  );
}
