/**
 * Type-level matrix for the discriminated union over `presentation` on
 * `NativeStackNavigationOptions`. These checks exist to lock the API contract
 * — the `@ts-expect-error` directives below are the assertion: if they stop
 * triggering an error, the union has regressed and these tests start failing
 * the build. There is no runtime behavior to verify in this file.
 */
/* eslint-disable no-void */

import type {
  CardNativeStackNavigationOptions,
  FlatNativeStackNavigationOptions,
  ModalNativeStackNavigationOptions,
  NativeStackNavigationOptions,
  SheetNativeStackNavigationOptions,
} from '../react-navigation/native-stack';

// `{}` (no presentation) → resolves to the card branch and only accepts
// common options; presentation-specific fields are still rejected.
{
  const _empty: NativeStackNavigationOptions = {};
  const _withTitle: NativeStackNavigationOptions = { title: 'Home' };
  const _emptyIsCard: CardNativeStackNavigationOptions = {};
  void _empty;
  void _withTitle;
  void _emptyIsCard;

  // @ts-expect-error - sheet options require presentation: 'formSheet' | 'pageSheet'
  const _emptyWithSheetOption: NativeStackNavigationOptions = {
    sheetAllowedDetents: [0.5],
  };
  void _emptyWithSheetOption;
}

// presentation: 'card' → only common + card-specific options allowed.
{
  const _ok: NativeStackNavigationOptions = {
    presentation: 'card',
    title: 'Home',
    fullScreenGestureEnabled: true,
    animationMatchesGesture: true,
    fullScreenGestureShadowEnabled: false,
  };
  void _ok;

  const _badSheet: NativeStackNavigationOptions = {
    presentation: 'card',
    // @ts-expect-error - sheetAllowedDetents only applies to formSheet/pageSheet
    sheetAllowedDetents: [0.5],
  };
  void _badSheet;

  const _badSheetCorner: NativeStackNavigationOptions = {
    presentation: 'card',
    // @ts-expect-error - sheetCornerRadius only applies to formSheet/pageSheet
    sheetCornerRadius: 12,
  };
  void _badSheetCorner;
}

// presentation: 'formSheet' → only common + sheet-specific options allowed.
{
  const _ok: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5, 1.0],
    sheetCornerRadius: 12,
    sheetGrabberVisible: true,
    sheetInitialDetentIndex: 0,
    sheetLargestUndimmedDetentIndex: 'last',
  };
  void _ok;

  const _badCard: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    // @ts-expect-error - fullScreenGestureEnabled only applies to card
    fullScreenGestureEnabled: true,
  };
  void _badCard;

  const _badCardAnim: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    // @ts-expect-error - animationMatchesGesture only applies to card
    animationMatchesGesture: true,
  };
  void _badCardAnim;
}

// presentation: 'pageSheet' → buckets with modal variants. The
// formSheet-specific options (`sheetAllowedDetents`, `sheetCornerRadius`, …)
// are *not* accepted because they map to iOS's `sheetPresentationController`
// which only attaches to `UIModalPresentationFormSheet`. Use `'formSheet'` if
// you need detent / corner-radius customization.
{
  const _ok: NativeStackNavigationOptions = {
    presentation: 'pageSheet',
    title: 'Settings',
  };
  void _ok;

  const _badSheet: NativeStackNavigationOptions = {
    presentation: 'pageSheet',
    // @ts-expect-error - sheetAllowedDetents only applies to formSheet
    sheetAllowedDetents: [0.5],
  };
  void _badSheet;

  const _badCard: NativeStackNavigationOptions = {
    presentation: 'pageSheet',
    // @ts-expect-error - card-only option on a sheet presentation
    fullScreenGestureEnabled: true,
  };
  void _badCard;
}

// Modal variants → only common options allowed; sheet AND card-only options
// rejected.
{
  const _ok: NativeStackNavigationOptions = {
    presentation: 'modal',
    title: 'Confirm',
  };
  const _full: NativeStackNavigationOptions = { presentation: 'fullScreenModal' };
  const _transparent: NativeStackNavigationOptions = { presentation: 'transparentModal' };
  const _contained: NativeStackNavigationOptions = { presentation: 'containedModal' };
  const _containedTrans: NativeStackNavigationOptions = {
    presentation: 'containedTransparentModal',
  };
  void _ok;
  void _full;
  void _transparent;
  void _contained;
  void _containedTrans;

  const _badSheet: NativeStackNavigationOptions = {
    presentation: 'modal',
    // @ts-expect-error - sheet-only option on a modal presentation
    sheetAllowedDetents: [0.5],
  };
  void _badSheet;

  const _badCard: NativeStackNavigationOptions = {
    presentation: 'modal',
    // @ts-expect-error - card-only option on a modal presentation
    fullScreenGestureEnabled: true,
  };
  void _badCard;
}

// Function-form options. Limitation: TypeScript only runs excess-property
// checks on the inner literal when the inner expression has a direct object
// contextual type — *not* when the contextual type comes from a `T | (() => T)`
// surface. The annotated case below is the strict-checking path users opt into
// by typing the return; the unannotated case is a known gap. Documented in
// docs/pages/router/migrate/sdk-55-to-56.mdx.
{
  type ScreenOptionsFn = (props: {
    route: { key: string; name: string };
    navigation: unknown;
  }) => NativeStackNavigationOptions;

  const _okSheet: ScreenOptionsFn = () => ({
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5],
  });
  void _okSheet;

  const _okEmpty: ScreenOptionsFn = () => ({});
  void _okEmpty;

  // With an inner return-type annotation, the literal IS narrowed against the
  // discriminator and excess properties are caught.
  const _badCardAnnotated: ScreenOptionsFn = (): NativeStackNavigationOptions => ({
    presentation: 'card',
    // @ts-expect-error - sheet option on card branch through a function-form options factory
    sheetAllowedDetents: [0.5],
  });
  void _badCardAnnotated;
}

// Branch types are still individually addressable for code that wants to
// keep typing simple by committing to one presentation up front.
{
  const _card: CardNativeStackNavigationOptions = { fullScreenGestureEnabled: true };
  const _modal: ModalNativeStackNavigationOptions = { presentation: 'modal' };
  const _sheet: SheetNativeStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5],
  };
  void _card;
  void _modal;
  void _sheet;
}

// FlatNativeStackNavigationOptions accepts every field at once. It is the
// internal escape hatch for resolved descriptors — not for end-user input.
{
  const _flat: FlatNativeStackNavigationOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5],
    fullScreenGestureEnabled: true,
  };
  void _flat;
}

// The discriminated union must be assignable to the flat shape — descriptor
// consumers rely on this covariance to avoid casts.
{
  const du: NativeStackNavigationOptions = { presentation: 'formSheet' };
  const flat: FlatNativeStackNavigationOptions = du;
  void flat;
}
