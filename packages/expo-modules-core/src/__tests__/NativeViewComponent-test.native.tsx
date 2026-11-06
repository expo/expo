import { render } from '@testing-library/react-native';
import { createRef } from 'react';

import { createNativeViewComponent } from '../NativeViewComponent';
import { requireNativeViewManager } from '../NativeViewManagerAdapter';
import '../setUpNativeViewComponentFactory.fx';

describe('createNativeViewComponent', () => {
  const CardView = createNativeViewComponent({
    name: 'ViewManagerAdapter_ExpoTestCards_CardView',
    displayName: 'CardView',
    validAttributes: { title: true },
    directEventTypes: {},
  });

  afterEach(() => {
    delete globalThis.expo.modules.ExpoTestCards;
  });

  it(`is installed in the expo global for native`, () => {
    expect((globalThis.expo as any).__createNativeViewComponent).toBe(createNativeViewComponent);
  });

  it(`renders the host component with the props unchanged`, async () => {
    const style = { flex: 1 };
    const { container } = await render(<CardView title="Card" style={style} />);
    const hostView = container.queryAll(
      (node) => node.type === 'ViewManagerAdapter_ExpoTestCards_CardView'
    )[0]!;

    expect(CardView.displayName).toBe('CardView');
    expect(hostView.props.title).toBe('Card');
    expect(hostView.props.style).toBe(style);
  });

  it(`maps aria props to their native accessibility props`, async () => {
    const { container } = await render(<CardView title="Card" aria-label="Next" id="card" />);
    const hostView = container.queryAll(
      (node) => node.type === 'ViewManagerAdapter_ExpoTestCards_CardView'
    )[0]!;

    expect(hostView.props).toMatchObject({
      title: 'Card',
      accessibilityLabel: 'Next',
      nativeID: 'card',
    });
    expect(hostView.props).not.toHaveProperty('aria-label');
    expect(hostView.props).not.toHaveProperty('id');
  });

  it(`passes the ref to the host component`, async () => {
    const ref = createRef<any>();
    const ariaRef = createRef<any>();
    await render(
      <>
        <CardView ref={ref} title="Card" />
        <CardView ref={ariaRef} aria-hidden />
      </>
    );

    // The host instance has the methods of a native view and the props after the aria mapping.
    expect(typeof ref.current.measure).toBe('function');
    expect(ref.current.props.title).toBe('Card');
    expect(typeof ariaRef.current.measure).toBe('function');
    expect(ariaRef.current.props.accessibilityElementsHidden).toBe(true);
  });

  it(`is returned by requireNativeViewManager when the module has it`, () => {
    const DefaultView = createNativeViewComponent({
      name: 'ViewManagerAdapter_ExpoTestCards',
      displayName: 'CardView',
      validAttributes: {},
      directEventTypes: {},
    });
    const nativeModule = { CardView };
    Object.defineProperty(nativeModule, '__expo_default_view__', { value: DefaultView });
    globalThis.expo.modules.ExpoTestCards = nativeModule;

    expect(requireNativeViewManager('ExpoTestCards', 'CardView')).toBe(CardView);
    expect(requireNativeViewManager('ExpoTestCards')).toBe(DefaultView);
  });

  it(`is not taken from a module function with the name of the view`, () => {
    const CardViewFunction = () => null;
    globalThis.expo.modules.ExpoTestCards = { CardView: CardViewFunction };

    const TestView = requireNativeViewManager('ExpoTestCards', 'CardView');
    expect(TestView).not.toBe(CardViewFunction);
    expect(TestView.displayName).toBe('CardView');
  });
});
