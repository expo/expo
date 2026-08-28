import { act, render } from '@testing-library/react-native';
import { createRef, useLayoutEffect, type Ref } from 'react';
import type { ReactNativeElement } from 'react-native';

import { TextInputHostProvider, useHostedTextInput, useTextInputHostRef } from '..';
import {
  TextInputState,
  passedThroughBlurTextInput,
  passedThroughFocusTextInput,
  resetFakeTextInputState,
} from './fakeTextInputState';

jest.mock('../textInputState', () => require('./fakeTextInputState'));

/**
 * A hosted field, standing in for a native text-field view. It is both the
 * imperative handle the host acts on and the controller the test drives, so
 * `focus`/`blur` record what the host asked the native side to do.
 */
type FakeField = {
  focus: jest.Mock;
  blur: jest.Mock;
  /** Sends the focus event the native field would send. */
  reportFocus: (focused: boolean) => void;
};

function createField(): FakeField {
  return {
    focus: jest.fn(),
    blur: jest.fn(),
    reportFocus: () => {
      throw new Error('The field is not mounted.');
    },
  };
}

/** Stands in for the native host view a hosted field registers. */
function createHostView() {
  return {} as ReactNativeElement;
}

function FakeHost({
  hostView,
  children,
}: {
  hostView: ReactNativeElement;
  children: React.ReactNode;
}) {
  const hostRef = useTextInputHostRef();
  // `<Host>` attaches this ref to its native view during the commit phase, which
  // is before any hosted field's effects run.
  hostRef.current = { getNativeRef: () => hostView };
  return <TextInputHostProvider hostRef={hostRef}>{children}</TextInputHostProvider>;
}

function FakeTextField({
  field,
  autoFocus,
  onFocusChange,
  options,
  ref,
}: {
  field: FakeField;
  autoFocus?: boolean;
  onFocusChange?: (focused: boolean) => void;
  options?: { blurOnUnmount?: boolean };
  ref?: Ref<FakeField>;
}) {
  const hosted = useHostedTextInput<FakeField>(ref, onFocusChange, options);
  const attach = hosted.ref;
  const reportFocus = hosted.onFocusChange;

  // The native view attaches its ref, and an `autoFocus` field reports focus,
  // before the registration effect runs.
  useLayoutEffect(() => {
    attach(field);
    field.reportFocus = reportFocus;
    if (autoFocus) {
      reportFocus(true);
    }
    return () => attach(null);
  }, [attach, autoFocus, field, reportFocus]);

  return null;
}

beforeEach(() => {
  resetFakeTextInputState();
});

describe('a hosted text field', () => {
  it('registers its host with React Native while it is mounted', () => {
    const hostView = createHostView();
    const view = render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={createField()} />
      </FakeHost>
    );

    expect(TextInputState.isTextInput(hostView)).toBe(true);

    view.unmount();
    expect(TextInputState.isTextInput(hostView)).toBe(false);
  });

  it('does nothing when it has no surrounding host', () => {
    const field = createField();
    expect(() => render(<FakeTextField field={field} />)).not.toThrow();
    act(() => field.reportFocus(true));
    expect(TextInputState.currentlyFocusedInput()).toBeNull();
  });

  it('makes its host the focused input while it holds focus', () => {
    const hostView = createHostView();
    const field = createField();
    render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={field} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    expect(TextInputState.currentlyFocusedInput()).toBe(hostView);

    act(() => field.reportFocus(false));
    expect(TextInputState.currentlyFocusedInput()).toBeNull();
  });

  it('reports focus that arrives before it is registered', () => {
    const hostView = createHostView();
    render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={createField()} autoFocus />
      </FakeHost>
    );

    expect(TextInputState.currentlyFocusedInput()).toBe(hostView);
  });

  it("still calls the app's own focus handler", () => {
    const onFocusChange = jest.fn();
    const field = createField();
    render(
      <FakeHost hostView={createHostView()}>
        <FakeTextField field={field} onFocusChange={onFocusChange} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    expect(onFocusChange).toHaveBeenCalledWith(true);
  });

  it("still forwards the app's own ref", () => {
    const appRef = createRef<FakeField>();
    const field = createField();
    render(
      <FakeHost hostView={createHostView()}>
        <FakeTextField field={field} ref={appRef} />
      </FakeHost>
    );

    expect(appRef.current).toBe(field);
  });
});

describe('two fields in one host', () => {
  function renderTwoFields() {
    const hostView = createHostView();
    const first = createField();
    const second = createField();
    const view = render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={first} />
        <FakeTextField field={second} />
      </FakeHost>
    );
    return { hostView, first, second, view };
  }

  it('keeps the host focused when focus moves and the blur event arrives first', () => {
    const { hostView, first, second } = renderTwoFields();

    act(() => first.reportFocus(true));
    act(() => {
      first.reportFocus(false);
      second.reportFocus(true);
    });

    expect(TextInputState.currentlyFocusedInput()).toBe(hostView);
  });

  it('keeps the host focused when focus moves and the focus event arrives first', () => {
    const { hostView, first, second } = renderTwoFields();

    act(() => first.reportFocus(true));
    act(() => {
      second.reportFocus(true);
      first.reportFocus(false);
    });

    expect(TextInputState.currentlyFocusedInput()).toBe(hostView);
  });

  it('clears the focused input when a field unmounts while it holds focus', () => {
    const hostView = createHostView();
    const field = createField();
    const view = render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={field} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    view.unmount();

    expect(TextInputState.currentlyFocusedInput()).toBeNull();
  });

  it('keeps the host registered until its last field unmounts', () => {
    const hostView = createHostView();
    const first = createField();
    const second = createField();

    function Fields({ showSecond }: { showSecond: boolean }) {
      return (
        <FakeHost hostView={hostView}>
          <FakeTextField field={first} />
          {showSecond ? <FakeTextField field={second} /> : null}
        </FakeHost>
      );
    }

    const view = render(<Fields showSecond />);
    view.update(<Fields showSecond={false} />);
    expect(TextInputState.isTextInput(hostView)).toBe(true);

    view.unmount();
    expect(TextInputState.isTextInput(hostView)).toBe(false);
  });
});

describe('React Native asking a host to blur', () => {
  function renderHostedField() {
    const hostView = createHostView();
    const field = createField();
    const view = render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={field} />
      </FakeHost>
    );
    return { hostView, field, view };
  }

  it('blurs the field that holds focus', () => {
    const { hostView, field } = renderHostedField();
    act(() => field.reportFocus(true));

    act(() => TextInputState.blurTextInput(hostView));

    expect(field.blur).toHaveBeenCalled();
    expect(TextInputState.currentlyFocusedInput()).toBeNull();
  });

  it('does nothing when a different input holds focus', () => {
    const { hostView, field } = renderHostedField();
    act(() => field.reportFocus(true));
    // A plain `TextInput` takes focus, which makes the host stale.
    TextInputState.focusInput(createHostView());

    act(() => TextInputState.blurTextInput(hostView));

    expect(field.blur).not.toHaveBeenCalled();
  });

  it('passes an input React Native owns through untouched', () => {
    renderHostedField();
    const plainTextInput = createHostView();
    TextInputState.focusInput(plainTextInput);

    act(() => TextInputState.blurTextInput(plainTextInput));

    expect(passedThroughBlurTextInput).toHaveBeenCalledWith(plainTextInput);
  });

  it('passes the host through once its last field has unmounted', () => {
    const { hostView, view } = renderHostedField();
    view.unmount();

    act(() => TextInputState.blurTextInput(hostView));

    expect(passedThroughBlurTextInput).toHaveBeenCalledWith(hostView);
  });
});

describe('React Native asking a host to focus', () => {
  it('refocuses the field that held focus last', () => {
    const hostView = createHostView();
    const first = createField();
    const second = createField();
    render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={first} />
        <FakeTextField field={second} />
      </FakeHost>
    );

    act(() => second.reportFocus(true));
    act(() => second.reportFocus(false));
    act(() => TextInputState.focusTextInput(hostView));

    expect(second.focus).toHaveBeenCalled();
    expect(first.focus).not.toHaveBeenCalled();
  });

  it('leaves the focused input alone until the field reports focus', () => {
    const hostView = createHostView();
    const field = createField();
    render(
      <FakeHost hostView={hostView}>
        <FakeTextField field={field} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    act(() => field.reportFocus(false));
    act(() => TextInputState.focusTextInput(hostView));

    expect(TextInputState.currentlyFocusedInput()).toBeNull();
    expect(passedThroughFocusTextInput).not.toHaveBeenCalled();
  });
});

describe('blurring a field when it unmounts', () => {
  it('blurs a field that holds focus', () => {
    const field = createField();
    const view = render(
      <FakeHost hostView={createHostView()}>
        <FakeTextField field={field} options={{ blurOnUnmount: true }} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    view.unmount();

    // The native views are still attached while a layout-effect cleanup runs, so the
    // field can be blurred before the row holding it goes away.
    expect(field.blur).toHaveBeenCalled();
  });

  it('leaves a field that does not hold focus alone', () => {
    const field = createField();
    const view = render(
      <FakeHost hostView={createHostView()}>
        <FakeTextField field={field} options={{ blurOnUnmount: true }} />
      </FakeHost>
    );

    view.unmount();

    expect(field.blur).not.toHaveBeenCalled();
  });

  it('leaves a focused field alone without the option', () => {
    const field = createField();
    const view = render(
      <FakeHost hostView={createHostView()}>
        <FakeTextField field={field} />
      </FakeHost>
    );

    act(() => field.reportFocus(true));
    view.unmount();

    // Compose binds `blur` to the host's focus manager, which clears focus for whichever
    // component holds it, so the behaviour stays opt-in.
    expect(field.blur).not.toHaveBeenCalled();
  });
});
