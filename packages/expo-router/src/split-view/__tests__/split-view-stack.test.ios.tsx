import { act, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { SplitView } from '../split-view';
import type { SplitViewRef } from '../split-view';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;

// Mock Platform.isPad = false for iPhone tests
beforeAll(() => {
  Object.defineProperty(Platform, 'isPad', { get: () => false });
});

let consoleWarnMock: jest.SpyInstance;
beforeEach(() => {
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  MockedScreenStackItem.mockClear();
});
afterEach(() => {
  consoleWarnMock.mockRestore();
});

describe('SplitView on iPhone (ScreenStack)', () => {
  it('renders primary column as base ScreenStackItem', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    // Primary column should be visible
    expect(screen.getByTestId('primary')).toBeVisible();
  });

  it('show("supplementary") pushes supplementary screen', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Column>
              <Text testID="supplementary">Supplementary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      ref.current!.show('supplementary');
    });

    expect(screen.getByTestId('supplementary')).toBeVisible();
  });

  it('show("secondary") pushes secondary screen after supplementary', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Column>
              <Text testID="supplementary">Supplementary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      ref.current!.show('supplementary');
    });

    act(() => {
      ref.current!.show('secondary');
    });

    expect(screen.getByTestId('content')).toBeVisible();
  });

  it('show("secondary") works directly from primary when no supplementary exists', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      ref.current!.show('secondary');
    });

    expect(screen.getByTestId('content')).toBeVisible();
  });

  it('throws when calling show("secondary") and skipping existing supplementary', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Column>
              <Text testID="supplementary">Supplementary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    // Should throw because supplementary must be shown first
    expect(() => {
      ref.current!.show('secondary');
    }).toThrow();
  });

  it('throws when calling show("supplementary") and supplementary column does not exist', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    expect(() => {
      ref.current!.show('supplementary');
    }).toThrow();
  });

  it('throws when calling show with invalid argument', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    expect(() => {
      (ref.current! as any).show('primary');
    }).toThrow();

    expect(() => {
      (ref.current! as any).show('foo');
    }).toThrow();
  });

  it('no-ops when calling show for already-visible column', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Column>
              <Text testID="supplementary">Supplementary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      ref.current!.show('supplementary');
    });

    // Calling show again for the same column should be a no-op (not throw)
    act(() => {
      ref.current!.show('supplementary');
    });

    expect(screen.getByTestId('supplementary')).toBeVisible();
  });

  it('back gesture (onDismissed) pops the top screen from state', () => {
    const ref = React.createRef<SplitViewRef>();

    renderRouter(
      {
        _layout: () => (
          <SplitView ref={ref}>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Column>
              <Text testID="supplementary">Supplementary</Text>
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    act(() => {
      ref.current!.show('supplementary');
    });

    expect(screen.getByTestId('supplementary')).toBeVisible();

    // Find the last ScreenStackItem call (the supplementary screen) and get its onDismissed
    const lastCallIndex = MockedScreenStackItem.mock.calls.length - 1;
    expect(lastCallIndex).toBeGreaterThanOrEqual(0);
    const onDismissed = MockedScreenStackItem.mock.calls[lastCallIndex][0].onDismissed;
    expect(onDismissed).toBeDefined();

    // Simulate native back gesture
    act(() => {
      onDismissed!({ nativeEvent: { dismissCount: 1 } } as any);
    });

    // After back gesture, only primary should be visible
    expect(screen.getByTestId('primary')).toBeVisible();
    expect(screen.queryByTestId('supplementary')).toBeNull();
  });

  it('warns when Inspector is used on iPhone', () => {
    renderRouter(
      {
        _layout: () => (
          <SplitView>
            <SplitView.Column>
              <Text testID="primary">Primary</Text>
            </SplitView.Column>
            <SplitView.Inspector>
              <Text>Inspector</Text>
            </SplitView.Inspector>
          </SplitView>
        ),
        index: () => <Text testID="content">Content</Text>,
      },
      { initialUrl: '/' }
    );

    expect(consoleWarnMock).toHaveBeenCalledWith(
      expect.stringContaining('Inspector')
    );
  });
});
