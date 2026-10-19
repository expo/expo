import { TooltipProvider } from '@radix-ui/react-tooltip';
import { render, RenderOptions } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import jestAxe from 'jest-axe';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { type NextRouter } from 'next/router';
import { type PropsWithChildren, type ReactElement } from 'react';

import { createHeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/common/withHeadingManager';

const Wrapper = ({ children }: PropsWithChildren) => (
  <TooltipProvider>
    <HeadingsContext.Provider value={createHeadingManager(new GithubSlugger(), { headings: [] })}>
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
    <TooltipProvider>
      <RouterContext.Provider value={router as NextRouter}>{element}</RouterContext.Provider>
    </TooltipProvider>
  );
}

export const axe = jestAxe.configureAxe({
  rules: {
    region: { enabled: false },
    // JSDOM accessibility testing library does not support color contrast testing in JSDOM
    'color-contrast': { enabled: false },
  },
});
