import { render, screen } from '@testing-library/react';

import { axe } from '~/common/test-utilities';

import { SnackInline } from '.';

describe(SnackInline, () => {
  it('labels the Snack submit button', () => {
    render(
      <SnackInline label="Example" dependencies={['expo-video']}>
        {`console.log('hello');`}
      </SnackInline>
    );
    expect(screen.getByRole('button', { name: 'Open in Snack' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <SnackInline label="Example" dependencies={['expo-video']}>
        {`console.log('hello');`}
      </SnackInline>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
