import PropTypes from 'prop-types';

import createHandler from './createHandler';
import GestureHandlerPropTypes from './GestureHandlerPropTypes';

const NativeViewGestureHandler = createHandler('NativeViewGestureHandler', {
  ...GestureHandlerPropTypes,

  // If changed, add changes to NATIVE_WRAPPER_PROPS_FILTER as well
  shouldActivateOnStart: PropTypes.bool,
  disallowInterruption: PropTypes.bool,
});

export default NativeViewGestureHandler;
