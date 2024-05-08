import { BookOpen02Icon, ArrowRightIcon } from '@expo/styleguide-icons';
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
  summary,
  nextChapterTitle,
  nextChapterDescription,
  nextChapterLink,
}: ProgressTrackerProps) {
  const { chapters, setChapters } = useTutorialChapterCompletion();
  const currentChapter = chapters[currentChapterIndex];

  const handleChapterComplete = () => {
    const updatedChapters = chapters.map((chapter: Chapter, index: number) => {
      if (index === currentChapterIndex) {
        return { ...chapter, completed: true };
      }
      return chapter;
    });
    setChapters(updatedChapters);
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

  const handleCheckboxChange = () => {
    if (currentChapter.completed) {
      handleChapterIncomplete();
    } else {
      handleChapterComplete();
    }
  };

  return (
    <>
      <div className="w-full border border-solid border-default rounded-md p-3 mx-auto mt-6 max-h-96 bg-subtle">
        <div className="flex items-center justify-center pt-2">
          <SuccessCheckmark />
        </div>
        <div className="flex items-center justify-center flex-col">
          <p className="flex items-center mt-6  text-center text-default heading-lg font-semibold">
            <BookOpen02Icon className="mr-2 size-6" /> {currentChapter.title}
          </p>
          <div className="flex items-center justify-center mt-2 max-w-lg leading-7">
            <p className="text-center text-default pb-2">{summary}</p>
          </div>
        </div>
        <div className="flex items-center justify-center mt-4">
          <Checkbox
            id={`chapter-${currentChapterIndex}`}
            checked={currentChapter.completed}
            label={
              currentChapter.completed ? 'Mark this chapter as unread' : 'Mark this chapter as read'
            }
            // readOnly
            onChange={handleCheckboxChange}
          />
        </div>
      </div>
      <>
        <P className="my-4">{nextChapterDescription}</P>
        <A
          href={nextChapterLink}
          className="flex flex-row justify-between border border-solid border-default rounded-md py-3 px-4 mb-3 hocus:shadow-xs"
          isStyled>
          <div className="flex flex-row gap-4 items-center">
            <div className="flex bg-element rounded-md self-center items-center justify-center min-w-[36px] h-9">
              <BookOpen02Icon className="icon-lg text-icon-default" />
            </div>
            <div>
              <DEMI>Next: {nextChapterTitle}</DEMI>
            </div>
          </div>
          <ArrowRightIcon className="text-icon-secondary self-center content-end ml-3 min-w-[20px]" />
        </A>
      </>
    </>
  );
}
