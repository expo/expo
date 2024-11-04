import { CheckCircleSolidIcon } from '@expo/styleguide-icons/solid/CheckCircleSolidIcon';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';

import { Callout } from '.';

describe(Callout, () => {
  it('renders callout with icon emoji', () => {
    render(<Callout icon="🎨">Hello</Callout>);
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with icon component', () => {
    render(<Callout icon={CheckCircleSolidIcon}>Hello</Callout>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders callout with default icon from info type', () => {
    render(<Callout type="info">Hello</Callout>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-info');
  });

  it('renders callout with default icon from warning type', () => {
    render(<Callout type="warning">Hello</Callout>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-warning');
  });

  it('renders callout with default icon from error type', () => {
    render(<Callout type="error">Hello</Callout>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-danger');
  });

  it('renders callout with warning style from warning type', () => {
    render(<Callout type="warning">Hello</Callout>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-warning');
  });

  it('renders callout with error style from error type', () => {
    render(<Callout type="error">Hello</Callout>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-danger');
  });

  it('renders callout with info style from info type', () => {
    render(<Callout type="info">Hello</Callout>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-info border-info');
  });

  it('renders from translated Markdown', () => {
    render(<ReactMarkdown components={{ blockquote: Callout }}>{'> Hello'}</ReactMarkdown>);
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders correct type from translated Markdown', () => {
    render(
      <ReactMarkdown components={{ blockquote: Callout }}>{`> **warning** Hello`}</ReactMarkdown>
    );
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-warning');
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders content starting with emphasized word which is not a type', () => {
    render(
      <ReactMarkdown components={{ blockquote: Callout }}>{`> **Note**: Hello`}</ReactMarkdown>
    );
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText(': Hello')).toBeInTheDocument();
  });
});
