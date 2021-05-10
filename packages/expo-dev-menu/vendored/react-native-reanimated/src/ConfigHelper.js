import ReanimatedModule from './ReanimatedModule';

/**
 * Styles allowed to be direcly updated in UI thread
 */
let UI_THREAD_PROPS_WHITELIST = {
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
let NATIVE_THREAD_PROPS_WHITELIST = {
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
  opacity: true,
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
};

function configureProps() {
  ReanimatedModule.configureProps(
    Object.keys(NATIVE_THREAD_PROPS_WHITELIST),
    Object.keys(UI_THREAD_PROPS_WHITELIST)
  );
}

export function addWhitelistedNativeProps(props) {
  NATIVE_THREAD_PROPS_WHITELIST = {
    ...NATIVE_THREAD_PROPS_WHITELIST,
    ...props,
  };
  configureProps();
}

export function addWhitelistedUIProps(props) {
  UI_THREAD_PROPS_WHITELIST = { ...UI_THREAD_PROPS_WHITELIST, ...props };
  configureProps();
}

configureProps();
