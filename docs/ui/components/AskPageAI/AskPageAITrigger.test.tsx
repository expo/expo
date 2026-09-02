import { TooltipProvider } from '@radix-ui/react-tooltip';
import { render, screen } from '@testing-library/react';

import { axe } from '~/common/test-utilities';

import { AskPageAITrigger } from './AskPageAITrigger';

describe(AskPageAITrigger, () => {
  it('exposes an accessible name containing the visible text', () => {
    render(
      <TooltipProvider>
        <AskPageAITrigger onClick={() => {}} />
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Ask AI about this page' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <TooltipProvider>
        <AskPageAITrigger onClick={() => {}} />
      </TooltipProvider>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
