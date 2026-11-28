import { CheckCircleSolidIcon } from '@expo/styleguide-icons/solid/CheckCircleSolidIcon';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';

import { axe } from '~/common/test-utilities';

import { InlineHelp } from '.';

describe(InlineHelp, () => {
  it('renders inline help with icon component', () => {
    render(<InlineHelp icon={CheckCircleSolidIcon}>Hello</InlineHelp>);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders inline help with default icon from info type', () => {
    render(<InlineHelp type="info">Hello</InlineHelp>);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('icon-md text-icon-default');
  });

  it('renders inline help with default icon from warning type', () => {
    render(<InlineHelp type="warning">Hello</InlineHelp>);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('icon-md text-palette-yellow11');
  });

  it('renders inline help with default icon from error type', () => {
    render(<InlineHelp type="error">Hello</InlineHelp>);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('icon-md text-palette-red11');
  });

  it('renders inline help with warning style from warning type', () => {
    render(<InlineHelp type="warning">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-palette-yellow3/40');
  });

  it('renders inline help with error style from error type', () => {
    render(<InlineHelp type="error">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-palette-red3/40');
  });

  it('renders inline help with important style from important type', () => {
    render(<InlineHelp type="important">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-palette-purple3/40');
  });

  it('renders inline help with info style from info type', () => {
    render(<InlineHelp type="info">Hello</InlineHelp>);
    expect(screen.getByTestId('callout-container')).toHaveClass(
      'bg-[#FBFCFD] dark:bg-screen border-default'
    );
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
    expect(screen.getByTestId('callout-container')).toHaveClass('bg-palette-yellow3/40');
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
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

  it('has no axe violations across callout types', async () => {
    const { container } = render(
      <>
        <InlineHelp>
          Default with a <a href="https://expo.dev/privacy">link</a>
        </InlineHelp>
        <InlineHelp type="warning">Warning</InlineHelp>
        <InlineHelp type="error">Error</InlineHelp>
        <InlineHelp type="info">Info</InlineHelp>
        <InlineHelp type="important">Important</InlineHelp>
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
