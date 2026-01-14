import { jest } from '@jest/globals';
import { act, fireEvent } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import { createRef, type RefObject } from 'react';

import { BASE_HEADING_LEVEL, HeadingType, createHeadingManager } from '~/common/headingManager';
import { renderWithHeadings } from '~/common/test-utilities';
import { HeadingsContext } from '~/common/withHeadingManager';
import { type ScrollContainerHandle } from '~/components/ScrollContainer';

import { TableOfContents, TableOfContentsHandles } from './TableOfContents';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({})),
});

const prepareHeadingManager = () => {
  const headingManager = createHeadingManager(new GithubSlugger(), { headings: [] });
  headingManager.addHeading('Base level heading', undefined, {});
  headingManager.addHeading('Level 3 subheading', 3, {});
  headingManager.addHeading('Code heading depth 1', 0, {
    sidebarDepth: 1,
    sidebarType: HeadingType.INLINE_CODE,
  });

  return headingManager;
};

const createHeadingManagerWithOffsets = () => {
  const headingManager = createHeadingManager(new GithubSlugger(), { headings: [] });
  const headingEntries = [
    { title: 'Intro', level: BASE_HEADING_LEVEL, slug: 'intro', offset: 0 },
    { title: 'Middle', level: BASE_HEADING_LEVEL + 1, slug: 'middle', offset: 900 },
    { title: 'End', level: BASE_HEADING_LEVEL, slug: 'end', offset: 1800 },
  ];

  headingEntries.forEach(({ title, level, slug, offset }) => {
    const heading = headingManager.addHeading(title, level, {}, slug);
    heading.ref.current = document.createElement('div');
    Object.defineProperty(heading.ref.current, 'offsetTop', {
      value: offset,
      configurable: true,
    });
  });

  return headingManager;
};

const createContentRef = (
  viewportHeight = 900,
  scrollHeight = 2400
): {
  contentRef: RefObject<ScrollContainerHandle | null>;
  scrollTo: jest.Mock;
  scrollRef: { current: HTMLDivElement };
} => {
  const scrollTo = jest.fn();
  const scrollElement = {
    clientHeight: viewportHeight,
    scrollHeight,
    scrollTo,
  } as unknown as HTMLDivElement;
  const scrollRef = { current: scrollElement };

  return {
    contentRef: {
      current: {
        getScrollRef: () => scrollRef,
        getScrollTop: () => 0,
      },
    } as unknown as RefObject<ScrollContainerHandle | null>,
    scrollTo,
    scrollRef,
  };
};

describe('TableOfContents', () => {
  test('correctly matches snapshot', () => {
    const headingManager = prepareHeadingManager();

    const { container } = renderWithHeadings(
      <HeadingsContext.Provider value={headingManager}>
        <TableOfContents headingManager={headingManager} />
      </HeadingsContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('activates headings near top, middle, and bottom positions', () => {
    const headingManager = createHeadingManagerWithOffsets();
    const { contentRef } = createContentRef();
    const tocRef = createRef<TableOfContentsHandles>();

    const { getByText } = renderWithHeadings(
      <HeadingsContext.Provider value={headingManager}>
        <TableOfContents ref={tocRef} headingManager={headingManager} contentRef={contentRef} />
      </HeadingsContext.Provider>
    );

    act(() => tocRef.current?.handleContentScroll?.(0));
    expect(tocRef.current).not.toBeNull();
    const introText = getByText('Intro');
    expect(introText).toHaveClass('!text-link');

    act(() => tocRef.current?.handleContentScroll?.(950));
    const middleText = getByText('Middle');
    expect(middleText).toHaveClass('!text-link');

    act(() => tocRef.current?.handleContentScroll?.(1500));
    const endText = getByText('End');
    expect(endText).toHaveClass('!text-link');
  });

  test('scrolls to align heading with activation line on click', () => {
    const headingManager = createHeadingManager(new GithubSlugger(), { headings: [] });
    const intro = headingManager.addHeading('Intro', BASE_HEADING_LEVEL, {}, 'intro');
    const middle = headingManager.addHeading('Middle', BASE_HEADING_LEVEL, {}, 'middle');
    intro.ref.current = document.createElement('div');
    middle.ref.current = document.createElement('div');
    Object.defineProperty(intro.ref.current, 'offsetTop', { value: 0, configurable: true });
    Object.defineProperty(middle.ref.current, 'offsetTop', { value: 800, configurable: true });

    const { contentRef, scrollTo, scrollRef } = createContentRef(800, 1600);
    const tocRef = createRef<TableOfContentsHandles>();

    const { getByText } = renderWithHeadings(
      <HeadingsContext.Provider value={headingManager}>
        <TableOfContents ref={tocRef} headingManager={headingManager} contentRef={contentRef} />
      </HeadingsContext.Provider>
    );

    act(() => {
      fireEvent.click(getByText('Middle'));
    });

    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        // 0.05 = ACTIVE_ITEM_OFFSET_FACTOR (1/20), 21 = scrollOffset
        top: 800 - scrollRef.current.clientHeight * 0.05 + 21,
      })
    );
  });
});
