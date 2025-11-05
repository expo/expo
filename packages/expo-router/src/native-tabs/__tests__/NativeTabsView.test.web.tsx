/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { NativeTabsView } from '../NativeTabsView';
import type { NativeTabOptions, NativeTabsProps, NativeTabsViewProps } from '../types';

describe('Native Bottom Tabs Navigation', () => {
  it('renders tabs correctly for two elements', () => {
    const tabs: NativeTabsViewProps['tabs'] = [
      {
        name: 'index',
        routeKey: 'r-0',
        options: { title: 'Index', hidden: false },
        contentRenderer: () => <div data-testid="index" />,
      },
      {
        name: 'about',
        routeKey: 'r-1',
        options: { title: 'About', hidden: false },
        contentRenderer: () => <div data-testid="about" />,
      },
    ];
    render(<NativeTabsView tabs={tabs} focusedIndex={0} onTabChange={() => {}} />);
    expect(screen.getByTestId('index')).toBeTruthy();
    // expect(screen.queryByTestId('about')).toBeNull();
    expect(screen.getByLabelText('Main')).toMatchSnapshot();
  });

  it('renders tabs correctly for three elements', () => {
    const tabs: NativeTabsViewProps['tabs'] = [
      {
        name: 'index',
        routeKey: 'r-0',
        options: { title: 'Index', hidden: false },
        contentRenderer: () => <div data-testid="index" />,
      },
      {
        name: 'about',
        routeKey: 'r-1',
        options: { title: 'About', hidden: false },
        contentRenderer: () => <div data-testid="about" />,
      },
      {
        name: 'tab-3',
        routeKey: 'r-2',
        options: { title: 'Tab-3', hidden: false },
        contentRenderer: () => <div data-testid="tab-3"> 3</div>,
      },
    ];

    render(<NativeTabsView tabs={tabs} focusedIndex={0} onTabChange={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3); // Only two visible tabs
    expect(screen.getByText('Index')).toBeTruthy();
    expect(screen.getByText('Tab-3')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });

  it.each([
    { index: 0, activeTestId: 'index' },
    { index: 1, activeTestId: 'about' },
    { index: 2, activeTestId: 'tab-3' },
    { index: 3, activeTestId: 'tab-4' },
    { index: 4, activeTestId: 'tab-5' },
    { index: 5, activeTestId: 'tab-6' },
  ] as const)('renders correct tab for index', ({ index, activeTestId }) => {
    const tabs: NativeTabsViewProps['tabs'] = [
      {
        name: 'index',
        routeKey: 'r-0',
        options: { title: 'Index', hidden: false },
        contentRenderer: () => <div data-testid="index">Index</div>,
      },
      {
        name: 'about',
        routeKey: 'r-1',
        options: { title: 'About', hidden: false },
        contentRenderer: () => <div data-testid="about">About</div>,
      },
      {
        name: 'tab-3',
        routeKey: 'r-2',
        options: { title: 'Tab-3', hidden: false },
        contentRenderer: () => <div data-testid="tab-3">Tab 3</div>,
      },
      {
        name: 'tab-4',
        routeKey: 'r-3',
        options: { title: 'Tab 4', hidden: false },
        contentRenderer: () => <div data-testid="tab-4">Tab 4</div>,
      },
      {
        name: 'tab-5',
        routeKey: 'r-4',
        options: { title: 'Tab 5', hidden: false },
        contentRenderer: () => <div data-testid="tab-5">Tab 5</div>,
      },
      {
        name: 'tab-6',
        routeKey: 'r-5',
        options: { title: 'Tab 6', hidden: false },
        contentRenderer: () => <div data-testid="tab-6">Tab 6</div>,
      },
    ];
    render(<NativeTabsView tabs={tabs} focusedIndex={index} onTabChange={() => {}} />);
    expect(screen.getByTestId(activeTestId)).toBeTruthy();
  });
});

describe('Focused tab handling', () => {
  it('correctly handles focus in the app', async () => {
    const tabs: NativeTabsViewProps['tabs'] = [
      {
        name: 'index',
        routeKey: 'r-0',
        options: { title: 'Index-tab', hidden: false },
        contentRenderer: () => (
          <div data-testid="index">
            <button data-testid="button-1">Button 1</button>
            <button data-testid="button-2">Button 2</button>
          </div>
        ),
      },
      {
        name: 'about',
        routeKey: 'r-1',
        options: { title: 'About-tab', hidden: false },
        contentRenderer: () => (
          <div data-testid="about">
            <button data-testid="button-3">Button 3</button>
            <button data-testid="button-4">Button 4</button>
          </div>
        ),
      },
    ];

    render(<NativeTabsView tabs={tabs} focusedIndex={0} onTabChange={() => {}} />);

    const IndexTab = screen.getByRole('tab', { name: 'Index-tab' });
    const AboutTab = screen.getByRole('tab', { name: 'About-tab' });
    const Button1 = screen.getByTestId('button-1');
    const Button2 = screen.getByTestId('button-2');

    expect(document.body).toHaveFocus();

    await userEvent.tab();
    expect(IndexTab).toHaveFocus();
    expect(screen.getByTestId('index').parentElement).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('about').parentElement).toHaveAttribute('data-state', 'inactive');

    await userEvent.keyboard('[ArrowRight]');
    expect(AboutTab).toHaveFocus();

    await userEvent.keyboard('[ArrowRight]');
    expect(IndexTab).toHaveFocus();

    // First tab is for the content container
    await userEvent.tab();
    await userEvent.tab();
    expect(Button1).toHaveFocus();

    await userEvent.tab();
    expect(Button2).toHaveFocus();
  });
});
