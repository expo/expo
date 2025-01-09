import { CheckCircleSolidIcon } from '@expo/styleguide-icons/solid/CheckCircleSolidIcon';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';

import { InlineHelp } from '.';

describe(InlineHelp, () => {
  it('renders inline help with icon emoji', () => {
    render(<InlineHelp icon="🎨">Hello</InlineHelp>);
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders inline help with icon component', () => {
    render(<InlineHelp icon={CheckCircleSolidIcon}>Hello</InlineHelp>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders inline help with default icon from info type', () => {
    render(<InlineHelp type="info">Hello</InlineHelp>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-info');
  });

  it('renders inline help with default icon from warning type', () => {
    render(<InlineHelp type="warning">Hello</InlineHelp>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-warning');
  });

  it('renders inline help with default icon from error type', () => {
    render(<InlineHelp type="error">Hello</InlineHelp>);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('icon-sm text-danger');
  });

  it('renders inline help with warning style from warning type', () => {
    render(<InlineHelp type="warning">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-warning');
  });

  it('renders inline help with error style from error type', () => {
    render(<InlineHelp type="error">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-danger');
  });

  it('renders inline help with info style from info type', () => {
    render(<InlineHelp type="info">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-info border-info');
  });

  it('renders from translated Markdown', () => {
    render(<ReactMarkdown components={{ blockquote: InlineHelp }}>{'> Hello'}</ReactMarkdown>);
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders correct type from translated Markdown', () => {
    render(
      <ReactMarkdown components={{ blockquote: InlineHelp }}>{`> **warning** Hello`}</ReactMarkdown>
    );
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-warning');
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders content starting with emphasized word which is not a type', () => {
    render(
      <ReactMarkdown components={{ blockquote: InlineHelp }}>{`> **Note**: Hello`}</ReactMarkdown>
    );
    expect(screen.getByTestId('callout-container')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText(': Hello')).toBeInTheDocument();
  });
});
