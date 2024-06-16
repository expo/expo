import { TooltipProvider } from '@radix-ui/react-tooltip';
import { render, RenderOptions } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { type NextRouter } from 'next/router';
import { type PropsWithChildren, type ReactElement } from 'react';

import { HeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const Wrapper = ({ children }: PropsWithChildren) => (
  <TooltipProvider>
    <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), { headings: [] })}>
      {children}
    </HeadingsContext.Provider>
  </TooltipProvider>
);

export function renderWithHeadings(
  element: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(element, { wrapper: Wrapper, ...options });
}

export function renderWithTestRouter(element: ReactElement, router: Partial<NextRouter> = {}) {
  return render(
    <RouterContext.Provider value={router as NextRouter}>{element}</RouterContext.Provider>
  );
}
