import { theme, CheckIcon } from '@expo/styleguide';
import { render } from '@testing-library/react';

import { Callout } from '.';

describe(Callout, () => {
  it('renders callout with icon emoji', () => {
    const { getByText } = render(<Callout icon="🎨">Hello</Callout>);
    expect(getByText('🎨')).toBeInTheDocument();
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with icon component', () => {
    const { getByText, getByTitle } = render(<Callout icon={CheckIcon}>Hello</Callout>);
    expect(getByTitle('Check-icon')).toBeInTheDocument();
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with default icon from info type', () => {
    const { getByTitle } = render(<Callout type="info">Hello</Callout>);
    expect(getByTitle('Info-icon')).toBeInTheDocument();
  });

  it('renders callout with default icon from warning type', () => {
    const { getByTitle } = render(<Callout type="warning">Hello</Callout>);
    expect(getByTitle('Warning-icon')).toBeInTheDocument();
  });

  it('renders callout with default icon from error type', () => {
    const { getByTitle } = render(<Callout type="error">Hello</Callout>);
    expect(getByTitle('Error-icon')).toBeInTheDocument();
  });

  it('renders callout with warning style from warning type', () => {
    const { container } = render(<Callout type="warning">Hello</Callout>);
    expect(container.firstChild).toHaveStyleRule('background-color', theme.background.warning);
  });

  it('renders callout with error style from warning type', () => {
    const { container } = render(<Callout type="error">Hello</Callout>);
    expect(container.firstChild).toHaveStyleRule('background-color', theme.background.error);
  });
});
