import { configureProps as jsiConfigureProps } from './reanimated2/core';

/**
 * Styles allowed to be direcly updated in UI thread
 */
let UI_THREAD_PROPS_WHITELIST: Record<string, boolean> = {
  opacity: true,
  transform: true,
  /* colors */
  backgroundColor: true,
  borderRightColor: true,
  borderBottomColor: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderStartColor: true,
  borderTopColor: true,
  /* ios styles */
  shadowOpacity: true,
  shadowRadius: true,
  /* legacy android transform properties */
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
};

/**
 * Whitelist of view props that can be updated in native thread via UIManagerModule
 */
let NATIVE_THREAD_PROPS_WHITELIST: Record<string, boolean> = {
  borderBottomWidth: true,
  borderEndWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderStartWidth: true,
  borderTopWidth: true,
  borderWidth: true,
  bottom: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  height: true,
  left: true,
  margin: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,
  padding: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  right: true,
  start: true,
  top: true,
  width: true,
  zIndex: true,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  elevation: true,
  fontSize: true,
  lineHeight: true,
  textShadowRadius: true,
  letterSpacing: true,
  /* strings */
  display: true,
  backfaceVisibility: true,
  overflow: true,
  resizeMode: true,
  fontStyle: true,
  fontWeight: true,
  textAlign: true,
  textDecorationLine: true,
  fontFamily: true,
  textAlignVertical: true,
  fontVariant: true,
  textDecorationStyle: true,
  textTransform: true,
  writingDirection: true,
  /* text color */
  color: true,
  tintColor: true,
  shadowColor: true,
  placeholderTextColor: true,
};

function configureProps(): void {
  jsiConfigureProps(
    Object.keys(UI_THREAD_PROPS_WHITELIST),
    Object.keys(NATIVE_THREAD_PROPS_WHITELIST)
  );
}

export function addWhitelistedNativeProps(
  props: Record<string, boolean>
): void {
  const oldSize = Object.keys(NATIVE_THREAD_PROPS_WHITELIST).length;
  NATIVE_THREAD_PROPS_WHITELIST = {
    ...NATIVE_THREAD_PROPS_WHITELIST,
    ...props,
  };
  if (oldSize !== Object.keys(NATIVE_THREAD_PROPS_WHITELIST).length) {
    configureProps();
  }
}

export function addWhitelistedUIProps(props: Record<string, boolean>): void {
  const oldSize = Object.keys(UI_THREAD_PROPS_WHITELIST).length;
  UI_THREAD_PROPS_WHITELIST = { ...UI_THREAD_PROPS_WHITELIST, ...props };
  if (oldSize !== Object.keys(UI_THREAD_PROPS_WHITELIST).length) {
    configureProps();
  }
}

const PROCESSED_VIEW_NAMES = new Set();

interface ViewConfig {
  uiViewClassName: string;
  validAttributes: Record<string, unknown>;
}
/**
 * updates UI props whitelist for given view host instance
 * this will work just once for every view name
 */

export function adaptViewConfig(viewConfig: ViewConfig): void {
  const viewName = viewConfig.uiViewClassName;
  const props = viewConfig.validAttributes;

  // update whitelist of UI props for this view name only once
  if (!PROCESSED_VIEW_NAMES.has(viewName)) {
    const propsToAdd: Record<string, boolean> = {};
    Object.keys(props).forEach((key) => {
      // we don't want to add native props as they affect layout
      // we also skip props which repeat here
      if (
        !(key in NATIVE_THREAD_PROPS_WHITELIST) &&
        !(key in UI_THREAD_PROPS_WHITELIST)
      ) {
        propsToAdd[key] = true;
      }
    });
    addWhitelistedUIProps(propsToAdd);

    PROCESSED_VIEW_NAMES.add(viewName);
  }
}

configureProps();
