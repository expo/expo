import { theme, CheckIcon } from '@expo/styleguide';
import { render, screen } from '@testing-library/react';

import { Callout } from '.';

describe(Callout, () => {
  it('renders callout with icon emoji', () => {
    render(<Callout icon="🎨">Hello</Callout>);
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with icon component', () => {
    render(<Callout icon={CheckIcon}>Hello</Callout>);
    expect(screen.getByTitle('Check-icon')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with default icon from info type', () => {
    render(<Callout type="info">Hello</Callout>);
    expect(screen.getByTitle('Info-icon')).toBeInTheDocument();
  });

  it('renders callout with default icon from warning type', () => {
    render(<Callout type="warning">Hello</Callout>);
    expect(screen.getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders callout with default icon from error type', () => {
    render(<Callout type="error">Hello</Callout>);
    expect(screen.getByTitle('Error-icon')).toBeInTheDocument();
  });

  it('renders callout with warning style from warning type', () => {
    render(<Callout type="warning">Hello</Callout>);
    expect(screen.getByTestId('callout-container')).toHaveStyleRule(
      'background-color',
      theme.background.warning
    );
  });

  it('renders callout with error style from warning type', () => {
    render(<Callout type="error">Hello</Callout>);
    expect(screen.getByTestId('callout-container')).toHaveStyleRule(
      'background-color',
      theme.background.error
    );
  });
});
