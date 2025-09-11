/** @jest-environment jsdom */
import type {
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/routers/lib/typescript/src';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

import { NativeTabsView } from '../NativeTabsView';
import type { ExtendedNativeTabOptions, NativeTabsProps, NativeTabsViewProps } from '../types';

const BASE_STATE: TabNavigationState<ParamListBase> = {
  stale: false,
  key: 'test',
  index: 0,
  routes: [],
  routeNames: [],
  history: [],
  type: 'tab',
  preloadedRouteKeys: [],
};

function createBuilderForRoutes(
  _routes: { options: ExtendedNativeTabOptions; name: string; render: () => React.ReactNode }[],
  partialState: Partial<TabNavigationState<ParamListBase>> = {}
) {
  const descriptors = _routes.reduce(
    (acc, { options, name, render }, index) => {
      acc[`r-${index}`] = {
        options,
        key: `r-${index}`,
        route: { key: `r-${index}`, name, params: {} },
        render,
      };
      return acc;
    },
    {} as Record<string, any>
  );
  const routes = _routes.map(({ name }, index) => ({
    key: `r-${index}`,
    name,
  }));
  const state = {
    ...BASE_STATE,
    ...partialState,
    routes,
    routeNames: routes.map((r) => r.name),
  } as TabNavigationState<ParamListBase>;
  const navigation = {
    dispatch: jest.fn(),
  } as unknown as NativeTabsViewProps['builder']['navigation'];
  const builder = {
    state,
    navigation,
    descriptors,
  } as NativeTabsViewProps['builder'];
  return {
    builder,
  };
}

describe('Native Bottom Tabs Navigation', () => {
  it('renders tabs correctly for two elements', () => {
    const { builder } = createBuilderForRoutes([
      {
        name: 'index',
        options: { title: 'Index', hidden: false },
        render: () => <div data-testid="index">Index</div>,
      },
      {
        name: 'about',
        options: { title: 'About', hidden: false },
        render: () => <div data-testid="about">About</div>,
      },
    ]);
    render(<NativeTabsView builder={builder} focusedIndex={0} />);
    expect(screen.getByTestId('index')).toBeTruthy();
    // expect(screen.queryByTestId('about')).toBeNull();
    expect(screen.getByLabelText('Main')).toMatchSnapshot();
  });

  it('renders tabs correctly for three elements', () => {
    const { builder } = createBuilderForRoutes([
      {
        name: 'index',
        options: { title: 'Index', hidden: false },
        render: () => <div data-testid="index" />,
      },
      {
        name: 'about',
        options: { title: 'About', hidden: false },
        render: () => <div data-testid="about" />,
      },
      {
        name: 'tab-3',
        options: { title: 'Tab-3', hidden: false },
        render: () => <div data-testid="tab-3"> 3</div>,
      },
    ]);

    render(<NativeTabsView builder={builder} focusedIndex={0} />);
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
    const { builder } = createBuilderForRoutes([
      {
        name: 'index',
        options: { title: 'Index', hidden: false },
        render: () => <div data-testid="index">Index</div>,
      },
      {
        name: 'about',
        options: { title: 'About', hidden: false },
        render: () => <div data-testid="about">About</div>,
      },
      {
        name: 'tab-3',
        options: { title: 'Tab-3', hidden: false },
        render: () => <div data-testid="tab-3">Tab 3</div>,
      },
      {
        name: 'tab-4',
        options: { title: 'Tab 4', hidden: false },
        render: () => <div data-testid="tab-4">Tab 4</div>,
      },
      {
        name: 'tab-5',
        options: { title: 'Tab 5', hidden: false },
        render: () => <div data-testid="tab-5">Tab 5</div>,
      },
      {
        name: 'tab-6',
        options: { title: 'Tab 6', hidden: false },
        render: () => <div data-testid="tab-6">Tab 6</div>,
      },
    ]);
    render(<NativeTabsView builder={builder} focusedIndex={index} />);
    expect(screen.getByTestId(activeTestId)).toBeTruthy();
  });

  it('correctly handles hidden tabs', () => {
    const { builder } = createBuilderForRoutes([
      {
        name: 'index',
        options: { title: 'Index-tab', hidden: false },
        render: () => <div data-testid="index">Index</div>,
      },
      {
        name: 'about',
        options: { title: 'About-tab', hidden: true },
        render: () => <div data-testid="about">About</div>,
      },
      {
        name: 'tab-3',
        options: { title: 'Tab-3-tab', hidden: false },
        render: () => <div data-testid="tab-3">Tab 3</div>,
      },
    ]);

    render(<NativeTabsView builder={builder} focusedIndex={2} />);
    expect(screen.getByTestId('index').parentElement).toHaveAttribute('data-state', 'inactive');
    expect(screen.queryByTestId('about')).toBeNull();
    expect(screen.getByTestId('tab-3').parentElement).toHaveAttribute('data-state', 'active');
    expect(screen.getAllByRole('tab')).toHaveLength(2); // Only two visible tabs
    expect(screen.getByText('Index-tab')).toBeTruthy();
    expect(screen.getByText('Tab-3-tab')).toBeTruthy();
    expect(screen.queryByText('About-tab')).toBeNull();
  });
});

describe('Focused tab handling', () => {
  it('correctly handles focus in the app', async () => {
    const { builder } = createBuilderForRoutes([
      {
        name: 'index',
        options: { title: 'Index-tab', hidden: false },
        render: () => (
          <div data-testid="index">
            <button data-testid="button-1">Button 1</button>
            <button data-testid="button-2">Button 2</button>
          </div>
        ),
      },
      {
        name: 'about',
        options: { title: 'About-tab', hidden: false },
        render: () => (
          <div data-testid="about">
            <button data-testid="button-3">Button 3</button>
            <button data-testid="button-4">Button 4</button>
          </div>
        ),
      },
    ]);

    render(<NativeTabsView builder={builder} focusedIndex={0} />);

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
