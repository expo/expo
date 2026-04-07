import { act, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Button, Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { router } from '../../../imperative-api';
import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

describe('Stack composition components render count', () => {
  it('initial render with composition components produces two ScreenStackItem calls', () => {
    const indexRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Stack.Screen.BackButton hidden />
            <Stack.Header blurEffect="regular" />
            <Text testID="index">Index</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(indexRender).toHaveBeenCalledTimes(1);

    // initial layout render + composition registration effect
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);

    // Final call should have merged composition options
    const finalProps = ScreenStackItem.mock.calls[1][0];
    expect(finalProps.headerConfig?.title).toBe('Home');
    expect(finalProps.headerConfig?.backButtonInCustomView).toBe(false);
    expect(finalProps.headerConfig?.blurEffect).toBe('regular');
  });

  it('navigation to another screen does not rerender first screen', () => {
    const indexRender = jest.fn();
    const detailRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Text testID="index">Index</Text>
          </>
        );
      },
      detail: function Detail() {
        detailRender();
        return (
          <>
            <Stack.Screen.Title>Detail</Stack.Screen.Title>
            <Text testID="detail">Detail</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailRender).not.toHaveBeenCalled();

    // layout render + index composition registration
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.title).toBe('Home');

    jest.clearAllMocks();

    act(() => router.push('/detail'));

    expect(screen.getByTestId('detail')).toBeVisible();

    // Index screen should NOT rerender
    expect(indexRender).not.toHaveBeenCalled();
    // Detail screen renders once
    expect(detailRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem calls after push:
    // [0] index (nav state change), [1] detail (initial), [2] index (rerender), [3] detail (composition)
    // TODO(@ubax): [2] is an extra ScreenStackItem call for index caused by the centralized
    // composition registry — detail's registration triggers a navigator-level state update
    // which re-renders ScreenStackItem for all routes, even though index's merged options are unchanged.
    // This should not cause performance issues in practice, because the screen content is memoized,
    // but we can optimize this in the future
    expect(ScreenStackItem).toHaveBeenCalledTimes(4);
    // Last call should have detail's composition options
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.title).toBe('Detail');

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();

    // Stack preserves screens — neither should rerender on back
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailRender).not.toHaveBeenCalled();

    // ScreenStackItem called for navigation state update, but no composition re-registration
    // [0] index (nav state update), [1] detail (nav state update)
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    // Index screen retains its previously merged composition options
    const homeCall = ScreenStackItem.mock.calls.find(
      (call) => call[0].headerConfig?.title === 'Home'
    );
    expect(homeCall).toBeDefined();
  });

  it('multiple composition components on same screen do not trigger extra renders', () => {
    const indexRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Stack.Screen.BackButton hidden />
            <Stack.Header blurEffect="regular" />
            <Stack.Toolbar placement="right">
              <Stack.Toolbar.Button icon="star" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">Index</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    expect(indexRender).toHaveBeenCalledTimes(1);

    // initial layout render + composition registration (batched, not per-component)
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);

    // Final call should have ALL four components' options merged
    const finalProps = ScreenStackItem.mock.calls[1][0];
    expect(finalProps.headerConfig?.title).toBe('Home');
    expect(finalProps.headerConfig?.backButtonInCustomView).toBe(false);
    expect(finalProps.headerConfig?.blurEffect).toBe('regular');
    expect(finalProps.headerConfig?.headerRightBarButtonItems).toHaveLength(1);
  });

  it('unfocused screens with composition do not trigger extra renders on further navigation', () => {
    const screenARender = jest.fn();
    const screenBRender = jest.fn();
    const screenCRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function ScreenA() {
        screenARender();
        return (
          <>
            <Stack.Screen.Title>Screen A</Stack.Screen.Title>
            <Text testID="screenA">Screen A</Text>
          </>
        );
      },
      'screen-b': function ScreenB() {
        screenBRender();
        return (
          <>
            <Stack.Screen.Title>Screen B</Stack.Screen.Title>
            <Stack.Screen.BackButton>Back to A</Stack.Screen.BackButton>
            <Text testID="screenB">Screen B</Text>
          </>
        );
      },
      'screen-c': function ScreenC() {
        screenCRender();
        return <Text testID="screenC">Screen C</Text>;
      },
    });

    expect(screen.getByTestId('screenA')).toBeVisible();

    // Navigate A -> B
    jest.clearAllMocks();
    act(() => router.push('/screen-b'));
    expect(screen.getByTestId('screenB')).toBeVisible();
    expect(screenARender).not.toHaveBeenCalled();
    expect(screenBRender).toHaveBeenCalledTimes(1);

    // TODO(@ubax): Same todo as before - reduce number of renders
    // ScreenStackItem calls after A -> B:
    // [0] screen A (nav state), [1] screen B (initial), [2] screen A (rerender), [3] screen B (composition)
    expect(ScreenStackItem).toHaveBeenCalledTimes(4);
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.title).toBe('Screen B');
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.backTitle).toBe('Back to A');

    // Navigate B -> C
    jest.clearAllMocks();
    act(() => router.push('/screen-c'));
    expect(screen.getByTestId('screenC')).toBeVisible();

    // Neither A nor B should rerender when navigating to C
    expect(screenARender).not.toHaveBeenCalled();
    expect(screenBRender).not.toHaveBeenCalled();
    expect(screenCRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem calls after B -> C:
    // Screen C has no composition components, so no composition registration call
    // [0] screen B (nav state), [1] screen C (initial), [2] screen B (rerender)
    expect(ScreenStackItem).toHaveBeenCalledTimes(3);
    // Find the screen C call — it should use the default route name as title
    const screenCCall = ScreenStackItem.mock.calls.find(
      (call) => call[0].headerConfig?.title === 'screen-c'
    );
    expect(screenCCall).toBeDefined();
  });

  it('local state changes do not trigger composition re-registration', () => {
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Screen.Title>Static Title</Stack.Screen.Title>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount(count + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Clear after initial settle
    jest.clearAllMocks();

    // Increment counter — triggers rerender of screen component
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    // Screen render fn IS called (state changed, expected)
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem should NOT be called — composition options unchanged
    // The dependency array in useCompositionOption prevents re-registration
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.Toolbar item structure changes DO trigger re-registration', () => {
    // Dual of the no-loop test: confirm we don't over-correct. Adding a
    // toolbar item must still rebuild the header.
    function Index() {
      const [showSecond, setShowSecond] = useState(false);
      return (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
            {showSecond && <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => {}} />}
          </Stack.Toolbar>
          <Button testID="toggle" title="Toggle" onPress={() => setShowSecond((v) => !v)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    // Initial: one button
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.headerRightBarButtonItems).toHaveLength(1);

    jest.clearAllMocks();

    // Toggle: now two buttons. Structural change, must re-register.
    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalled();
    const updatedProps = ScreenStackItem.mock.calls[ScreenStackItem.mock.calls.length - 1][0];
    expect(updatedProps.headerConfig?.headerRightBarButtonItems).toHaveLength(2);
  });

  it('local state changes do not infinite-loop with Stack.Toolbar', () => {
    // Regression test: JSX `children` is a new array every parent render, so
    // depending on it directly inside `useCompositionOption` re-dispatched on
    // every render, which re-rendered the navigator, which re-rendered the
    // screen, which created new children, an infinite loop.
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Clear after initial settle
    jest.clearAllMocks();

    // Increment counter, triggers rerender of screen component
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    // Screen render fn IS called once (state changed, expected)
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem should NOT be called: toolbar items are structurally
    // unchanged so the registered options object stays reference-stable.
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.Toolbar item reordering DOES trigger re-registration', () => {
    // Proves the structural fingerprint captures element order. Two buttons
    // swapped via state must produce a different fingerprint and re-register.
    // Using an array (not a Fragment) so React.Children.toArray flattens it
    // into the toolbar's child list correctly.
    function Index() {
      const [reversed, setReversed] = useState(false);
      return (
        <>
          <Stack.Toolbar placement="right">
            {reversed
              ? [
                  <Stack.Toolbar.Button key="b" icon="ellipsis.circle" onPress={() => {}} />,
                  <Stack.Toolbar.Button key="a" icon="star" onPress={() => {}} />,
                ]
              : [
                  <Stack.Toolbar.Button key="a" icon="star" onPress={() => {}} />,
                  <Stack.Toolbar.Button key="b" icon="ellipsis.circle" onPress={() => {}} />,
                ]}
          </Stack.Toolbar>
          <Button testID="reverse" title="rev" onPress={() => setReversed((v) => !v)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    // Initial: [star, ellipsis.circle]
    const initialItems = ScreenStackItem.mock.calls[1][0].headerConfig?.headerRightBarButtonItems;
    expect(initialItems).toHaveLength(2);

    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('reverse'));
    });

    // After reverse: re-registration must have fired AND the items array must
    // be in the swapped order. JSON-comparing the items proves both at once
    // (re-registration happened and the order actually changed).
    expect(ScreenStackItem).toHaveBeenCalled();
    const finalItems =
      ScreenStackItem.mock.calls[ScreenStackItem.mock.calls.length - 1][0].headerConfig
        ?.headerRightBarButtonItems;
    expect(finalItems).toHaveLength(2);
    expect(JSON.stringify(finalItems)).not.toEqual(JSON.stringify(initialItems));
  });

  it('Stack.Toolbar visual prop changes DO trigger re-registration', () => {
    // Proves serializable props are captured in the fingerprint. Same button,
    // same handler, only the icon string changes via state.
    function Index() {
      const [filled, setFilled] = useState(false);
      return (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon={filled ? 'star.fill' : 'star'} onPress={() => {}} />
          </Stack.Toolbar>
          <Button testID="toggle" title="toggle" onPress={() => setFilled((v) => !v)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalled();
  });

  it('Stack.Toolbar nested menu action changes DO trigger re-registration', () => {
    // Proves the fingerprint recurses into the `children` prop of nested
    // elements. Adding a MenuAction inside a Menu must change the fingerprint
    // even though the outer Menu's other props are unchanged.
    function Index() {
      const [showExtra, setShowExtra] = useState(false);
      return (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Menu icon="ellipsis.circle">
              <Stack.Toolbar.MenuAction onPress={() => {}}>First</Stack.Toolbar.MenuAction>
              {showExtra && (
                <Stack.Toolbar.MenuAction onPress={() => {}}>Second</Stack.Toolbar.MenuAction>
              )}
            </Stack.Toolbar.Menu>
          </Stack.Toolbar>
          <Button testID="toggle" title="toggle" onPress={() => setShowExtra((v) => !v)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(ScreenStackItem).toHaveBeenCalled();
  });

  it('Stack.Toolbar handlers reading state via closure do not retrigger registration', () => {
    // Strengthens the no-loop test: the in-toolbar `onPress` actually closes
    // over `count` (a new closure on every render), but function-typed props
    // are skipped by the fingerprint, so re-registration must NOT fire.
    function Index() {
      const [count, setCount] = useState(0);
      // Closes over `count` so the closure is genuinely a different identity
      // on every render. The fingerprint must still treat it as unchanged.
      const handleStarPress = () => count;
      return (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="star" onPress={handleStarPress} />
          </Stack.Toolbar>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();

    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('changed composition options DO trigger ScreenStackItem update', () => {
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [title, setTitle] = useState('Initial');
      return (
        <>
          <Stack.Screen.Title>{title}</Stack.Screen.Title>
          <Text testID="title">{title}</Text>
          <Button testID="changeTitle" title="Change" onPress={() => setTitle('Updated')} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('title')).toHaveTextContent('Initial');

    // Verify initial title propagated
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Initial');

    // Clear after initial settle
    jest.clearAllMocks();

    // Change the title — composition options actually change
    act(() => {
      fireEvent.press(screen.getByTestId('changeTitle'));
    });

    expect(screen.getByTestId('title')).toHaveTextContent('Updated');

    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem SHOULD be called — composition options changed
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('Updated');
  });

  it('conditionally removed composition component clears its options', () => {
    function Index() {
      const [showBackButton, setShowBackButton] = useState(true);
      return (
        <>
          <Stack.Screen.Title>Home</Stack.Screen.Title>
          {showBackButton && <Stack.Screen.BackButton>Go Back</Stack.Screen.BackButton>}
          <Text testID="content">Content</Text>
          <Button
            testID="toggleBackButton"
            title="Toggle"
            onPress={() => setShowBackButton((v) => !v)}
          />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Verify initial state has back button options
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Home');
    expect(initialProps.headerConfig?.backTitle).toBe('Go Back');

    jest.clearAllMocks();

    // Remove the BackButton component
    act(() => {
      fireEvent.press(screen.getByTestId('toggleBackButton'));
    });

    // ScreenStackItem should be called — unregister fires, registry changes
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    // The back button options should be cleared (unregistered from composition registry)
    const finalProps = ScreenStackItem.mock.calls[0][0];
    // Title still present (its composition component is still mounted)
    expect(finalProps.headerConfig?.title).toBe('Home');
    // Back button title should be gone (component unmounted, unregistered)
    expect(finalProps.headerConfig?.backTitle).toBeUndefined();
  });

  it('switching composition suites mounts/unmounts components with minimal updates', () => {
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [suite, setSuite] = useState(0);
      return (
        <>
          {suite === 0 && (
            <>
              <Stack.Screen.Title>Home</Stack.Screen.Title>
              <Stack.Screen.BackButton hidden />
              <Stack.Header blurEffect="regular" />
            </>
          )}
          {suite === 1 && (
            <>
              <Stack.Screen.Title>Browse</Stack.Screen.Title>
              <Stack.Header blurEffect="prominent" />
            </>
          )}
          {suite === 2 && (
            <>
              <Stack.Screen.Title>Search</Stack.Screen.Title>
              <Stack.Screen.BackButton hidden />
            </>
          )}
          <Text testID="content">Content</Text>
          <Button testID="nextSuite" title="Next" onPress={() => setSuite((s) => (s + 1) % 3)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    expect(indexRender).toHaveBeenCalledTimes(1);
    // Initial render + suite 0 registration (batched)
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);

    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Home');
    expect(initialProps.headerConfig?.backButtonInCustomView).toBe(false);
    expect(initialProps.headerConfig?.blurEffect).toBe('regular');

    // Switch to suite 1
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('nextSuite'));
    });

    // One screen render (state change), one batched ScreenStackItem update
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const suite1Props = ScreenStackItem.mock.calls[0][0];
    expect(suite1Props.headerConfig?.title).toBe('Browse');
    expect(suite1Props.headerConfig?.blurEffect).toBe('prominent');
    // BackButton unmounted — its options should be cleared
    expect(suite1Props.headerConfig?.backTitle).toBeUndefined();

    // Switch to suite 2
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('nextSuite'));
    });

    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const suite2Props = ScreenStackItem.mock.calls[0][0];
    expect(suite2Props.headerConfig?.title).toBe('Search');
    expect(suite2Props.headerConfig?.backButtonInCustomView).toBe(false);
    // Header unmounted — blurEffect should be cleared
    expect(suite2Props.headerConfig?.blurEffect).toBeUndefined();
  });

  it('composition suite switch on top screen does not rerender screen below', () => {
    const indexRender = jest.fn();
    const detailRender = jest.fn();

    function Index() {
      indexRender();
      return (
        <>
          <Stack.Screen.Title>Home</Stack.Screen.Title>
          <Stack.Screen.BackButton hidden />
          <Text testID="index">Index</Text>
        </>
      );
    }

    function Detail() {
      detailRender();
      const [suite, setSuite] = useState(0);
      return (
        <>
          {suite === 0 && (
            <>
              <Stack.Screen.Title>Detail</Stack.Screen.Title>
              <Stack.Screen.BackButton>Go back</Stack.Screen.BackButton>
              <Stack.Header blurEffect="regular" />
            </>
          )}
          {suite === 1 && (
            <>
              <Stack.Screen.Title>Detail Updated</Stack.Screen.Title>
              <Stack.Header blurEffect="prominent" />
            </>
          )}
          <Text testID="detail">Detail</Text>
          <Button
            testID="toggleSuite"
            title="Toggle"
            onPress={() => setSuite((s) => (s === 0 ? 1 : 0))}
          />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
      detail: Detail,
    });

    expect(screen.getByTestId('index')).toBeVisible();

    // Navigate to detail
    act(() => router.push('/detail'));
    expect(screen.getByTestId('detail')).toBeVisible();

    jest.clearAllMocks();

    // Switch suite on detail screen
    act(() => {
      fireEvent.press(screen.getByTestId('toggleSuite'));
    });

    // Index screen should NOT rerender — stack preserves screens, composition change is local
    expect(indexRender).not.toHaveBeenCalled();
    // Detail screen renders once (state change)
    expect(detailRender).toHaveBeenCalledTimes(1);

    // Detail's composition options should be updated
    const lastDetailCall = ScreenStackItem.mock.calls.find(
      (call) => call[0].headerConfig?.title === 'Detail Updated'
    );
    expect(lastDetailCall).toBeDefined();
    expect(lastDetailCall![0].headerConfig?.blurEffect).toBe('prominent');
    // BackButton unmounted — backTitle should be cleared
    expect(lastDetailCall![0].headerConfig?.backTitle).toBeUndefined();
  });

  // Regression suite for the bug class fixed by useStableCompositionOption.
  // Each caller below previously dispatched on every parent render when its
  // useMemo deps included an unstable value (inline style, JSX-array
  // children, inline callback). On a real device this cascades through the
  // navigator and crashes with "Maximum update depth exceeded"; in jest the
  // ScreenStackItem mock severs the cascade so we only see the symptom (one
  // extra ScreenStackItem call after a setState that didn't change any
  // composition input). The helper absorbs the memoization so these all
  // become no-ops.

  it('Stack.Header with inline style does not retrigger registration on parent state change', () => {
    function Index() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Header style={{ backgroundColor: '#fff' }} />
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.Screen.Title with inline style does not retrigger registration on parent state change', () => {
    function Index() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Screen.Title style={{ fontSize: 18 }}>Static</Stack.Screen.Title>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.Screen.Title with JSX-array children does not retrigger registration on parent state change', () => {
    function Index() {
      const [count, setCount] = useState(0);
      const name = 'Ray';
      return (
        <>
          {/* Two-child JSX produces a new array reference on every render */}
          <Stack.Screen.Title>Hello {name}</Stack.Screen.Title>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.SearchBar with inline onChangeText does not retrigger registration on parent state change', () => {
    function Index() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.SearchBar
            placeholder="Search..."
            // Inline arrow: new identity every render. Mirrors the docs
            // example at native-tabs.mdx and is the trigger for the bug class.
            onChangeText={(_text) => undefined}
          />
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('Stack.Screen.BackButton with inline style does not retrigger registration on parent state change', () => {
    function Index() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Screen.BackButton style={{ fontSize: 14 }}>Back</Stack.Screen.BackButton>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount((c) => c + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    jest.clearAllMocks();
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });
});
