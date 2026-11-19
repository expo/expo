import { render } from '@testing-library/react-native';
import { createRef } from 'react';
import { NativeComponentRegistry } from 'react-native';

import { createNativeViewComponent } from '../NativeViewComponent';
import { requireNativeViewManager } from '../NativeViewManagerAdapter';
import { SharedObject } from '../SharedObject';
import '../setUpNativeViewComponentFactory.fx';

describe('createNativeViewComponent', () => {
  const CardView = createNativeViewComponent(
    'ViewManagerAdapter_ExpoTestCards_CardView',
    'CardView',
    { title: true },
    {}
  );

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

  it(`passes a shared object prop to native as the object`, () => {
    const getViewConfig = jest.spyOn(NativeComponentRegistry, 'get');
    createNativeViewComponent(
      'ViewManagerAdapter_ExpoTestCards_ImageView',
      'ImageView',
      { image: true },
      {}
    );
    const { validAttributes } = getViewConfig.mock.calls.at(-1)![1]();
    getViewConfig.mockRestore();

    const image = new SharedObject();
    Object.defineProperty(image, '__expo_shared_object_id__', { value: 7 });

    // The renderer builds the props that native gets with this function.
    const {
      create: createAttributePayload,
    } = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload');
    expect(createAttributePayload({ image }, validAttributes).image).toBe(image);
  });

  it(`sends a new shared object of the same class to native`, () => {
    const getViewConfig = jest.spyOn(NativeComponentRegistry, 'get');
    createNativeViewComponent(
      'ViewManagerAdapter_ExpoTestCards_PlayerView',
      'PlayerView',
      { player: true },
      {}
    );
    const { validAttributes } = getViewConfig.mock.calls.at(-1)![1]();
    getViewConfig.mockRestore();

    const player = new SharedObject();
    const nextPlayer = new SharedObject();

    // The renderer builds the props that native gets on an update with this function.
    const {
      diff: diffAttributePayload,
    } = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload');
    expect(diffAttributePayload({ player }, { player: nextPlayer }, validAttributes)).toEqual({
      player: nextPlayer,
    });
    expect(diffAttributePayload({ player }, { player }, validAttributes)).toBeNull();
  });

  it(`is returned by requireNativeViewManager when the module has it`, () => {
    const DefaultView = createNativeViewComponent(
      'ViewManagerAdapter_ExpoTestCards',
      'CardView',
      {},
      {}
    );
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
