import { useRef, useCallback, useEffect, useMemo, forwardRef } from 'react';
import { View, Platform, findNodeHandle } from 'react-native';
import { jsx as _jsx } from 'react/jsx-runtime';

import RNViewShot from './RNViewShot';
const neverEndingPromise = new Promise(() => {});
const acceptedFormats = ['png', 'jpg'].concat(
  Platform.OS === 'android' ? ['webp', 'webm', 'raw'] : []
);
const acceptedResults = ['tmpfile', 'base64', 'data-uri'].concat(
  Platform.OS === 'android' ? ['zip-base64'] : []
);
const defaultOptions = {
  format: 'png',
  quality: 1,
  result: 'tmpfile',
  snapshotContentContainer: false,
  handleGLSurfaceViewOnAndroid: false,
};
// validate and coerce options
function validateOptions(input) {
  const options = {
    ...defaultOptions,
    ...input,
  };
  const errors = [];
  if ('width' in options && (typeof options.width !== 'number' || options.width <= 0)) {
    errors.push('option width should be a positive number');
    delete options.width;
  }
  if ('height' in options && (typeof options.height !== 'number' || options.height <= 0)) {
    errors.push('option height should be a positive number');
    delete options.height;
  }
  if (typeof options.quality !== 'number' || options.quality < 0 || options.quality > 1) {
    errors.push('option quality should be a number between 0.0 and 1.0');
    options.quality = defaultOptions.quality;
  }
  if (typeof options.snapshotContentContainer !== 'boolean') {
    errors.push('option snapshotContentContainer should be a boolean');
  }
  if (typeof options.handleGLSurfaceViewOnAndroid !== 'boolean') {
    errors.push('option handleGLSurfaceViewOnAndroid should be a boolean');
  }
  if (acceptedFormats.indexOf(options.format || '') === -1) {
    const badFormat = options.format;
    options.format = defaultOptions.format;
    errors.push(
      "option format '" + badFormat + "' is not in valid formats: " + acceptedFormats.join(' | ')
    );
  } else if (options.format === 'webm') {
    errors.push(
      "option format 'webm' is deprecated and will be removed in a future version. Use 'webp' instead (the encoded data has always been WEBP, only the extension was misnamed)."
    );
  }
  if (acceptedResults.indexOf(options.result || '') === -1) {
    const badResult = options.result;
    options.result = defaultOptions.result;
    errors.push(
      "option result '" + badResult + "' is not a valid result: " + acceptedResults.join(' | ')
    );
  }
  return { options, errors };
}
export function captureRef(view, optionsObject) {
  if (!RNViewShot) {
    console.warn(
      'react-native-view-shot: RNViewShot is undefined. Make sure the library is linked on the native side.'
    );
    throw new Error(
      'react-native-view-shot: NativeModules.RNViewShot is undefined. Make sure the library is linked on the native side.'
    );
  }
  let viewHandle =
    typeof view === 'number'
      ? view
      : view && typeof view === 'object' && 'current' in view
        ? view.current
        : view;
  if (Platform.OS !== 'web' && typeof viewHandle !== 'number') {
    const node = findNodeHandle(viewHandle);
    if (!node) {
      return Promise.reject(new Error('findNodeHandle failed to resolve view=' + String(view)));
    }
    viewHandle = node;
  }
  const { options, errors } = validateOptions(optionsObject);
  if (errors.length > 0) {
    console.warn('react-native-view-shot: bad options:\n' + errors.map((e) => `- ${e}`).join('\n'));
  }
  if (Platform.OS === 'windows' && optionsObject?.snapshotContentContainer) {
    console.warn(
      'react-native-view-shot: `snapshotContentContainer` is not supported on Windows. The option is ignored; only the visible viewport will be captured.'
    );
  }
  return RNViewShot.captureRef(viewHandle, options);
}
export function releaseCapture(uri) {
  if (typeof uri !== 'string') {
    if (__DEV__) {
      console.warn('Invalid argument to releaseCapture. Got: ' + uri);
    }
  } else {
    RNViewShot.releaseCapture(uri);
  }
}
export function captureScreen(optionsObject) {
  if (!RNViewShot) {
    console.warn(
      'react-native-view-shot: RNViewShot is undefined. Make sure the library is linked on the native side.'
    );
    throw new Error(
      'react-native-view-shot: NativeModules.RNViewShot is undefined. Make sure the library is linked on the native side.'
    );
  }
  const { options, errors } = validateOptions(optionsObject);
  if (errors.length > 0) {
    console.warn('react-native-view-shot: bad options:\n' + errors.map((e) => `- ${e}`).join('\n'));
  }
  return RNViewShot.captureScreen(options);
}
// Props for ViewShot component
function checkCompatibleProps(props) {
  if (!props.captureMode && props.onCapture) {
    // in that case, it's authorized if you call capture() yourself
  } else if (props.captureMode && !props.onCapture) {
    console.warn(
      'react-native-view-shot: captureMode prop is defined but onCapture prop callback is missing'
    );
  } else if (
    (props.captureMode === 'continuous' || props.captureMode === 'update') &&
    props.options &&
    props.options.result &&
    props.options.result !== 'tmpfile'
  ) {
    console.warn(
      'react-native-view-shot: result=tmpfile is recommended for captureMode=' + props.captureMode
    );
  }
}
const ViewShotComponent = forwardRef(function ViewShot(props, ref) {
  const { children, options, captureMode, onCapture, onCaptureFailure, onLayout, style } = props;
  const rootRef = useRef(null);
  const rafRef = useRef(null);
  const lastCapturedURIRef = useRef(null);
  const resolveFirstLayoutRef = useRef(null);
  const firstLayoutPromise = useMemo(
    () =>
      new Promise((resolve) => {
        resolveFirstLayoutRef.current = resolve;
      }),
    []
  );
  // Keep latest props in refs so stable callbacks always see fresh values
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const onCaptureFailureRef = useRef(onCaptureFailure);
  onCaptureFailureRef.current = onCaptureFailure;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const capture = useCallback(
    () =>
      firstLayoutPromise
        .then(() => {
          if (!rootRef.current) return neverEndingPromise;
          return captureRef(rootRef.current, optionsRef.current);
        })
        .then(
          (uri) => {
            if (!rootRef.current) return uri;
            if (lastCapturedURIRef.current) {
              setTimeout(releaseCapture, 500, lastCapturedURIRef.current);
            }
            lastCapturedURIRef.current = uri;
            if (onCaptureRef.current) onCaptureRef.current(uri);
            return uri;
          },
          (e) => {
            if (!rootRef.current) throw e;
            if (onCaptureFailureRef.current) onCaptureFailureRef.current(e);
            throw e;
          }
        ),
    [firstLayoutPromise]
  );
  const setRootRef = useCallback(
    (node) => {
      rootRef.current = node;
      if (node) node.capture = capture;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [capture, ref]
  );
  const syncCaptureLoop = useCallback(
    (mode) => {
      cancelAnimationFrame(rafRef.current);
      if (mode === 'continuous') {
        let previousCaptureURI = '-';
        const loop = () => {
          rafRef.current = requestAnimationFrame(loop);
          if (previousCaptureURI === lastCapturedURIRef.current) return;
          previousCaptureURI = lastCapturedURIRef.current;
          capture();
        };
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [capture]
  );
  useEffect(() => {
    if (__DEV__) checkCompatibleProps(props);
    if (captureMode === 'mount') capture();
    // Run once: re-firing on prop changes would double-trigger `mount`
    // capture; the `[captureMode]` effect below handles loop sync, and the
    // no-deps effect below handles `update` mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    syncCaptureLoop(captureMode);
    return () => syncCaptureLoop(null);
  }, [captureMode, syncCaptureLoop]);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (captureMode === 'update') capture();
  });
  const onLayoutHandler = useCallback(
    (e) => {
      if (resolveFirstLayoutRef.current) {
        resolveFirstLayoutRef.current(e.nativeEvent.layout);
        resolveFirstLayoutRef.current = null;
      }
      if (onLayout) onLayout(e);
    },
    [onLayout]
  );
  return _jsx(View, {
    ref: setRootRef,
    collapsable: false,
    onLayout: onLayoutHandler,
    style: style,
    children: children,
  });
});
const ViewShot = ViewShotComponent;
ViewShot.captureRef = captureRef;
ViewShot.releaseCapture = releaseCapture;
export default ViewShot;
//# sourceMappingURL=index.js.map
