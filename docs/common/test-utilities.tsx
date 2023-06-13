import { render, RenderOptions } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import { PropsWithChildren, ReactElement } from 'react';

import { HeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const Wrapper = ({ children }: PropsWithChildren<object>) => (
  <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), { headings: [] })}>
    {children}
  </HeadingsContext.Provider>
);

export const renderWithHeadings = (
  element: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(element, { wrapper: Wrapper, ...options });
