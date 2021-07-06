import PropTypes from 'prop-types';

// If changed, add changes to NATIVE_WRAPPER_PROPS_FILTER as well
const GestureHandlerPropTypes = {
  id: PropTypes.string,
  minPointers: PropTypes.number,
  enabled: PropTypes.bool,
  waitFor: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    ),
  ]),
  simultaneousHandlers: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    ),
  ]),
  shouldCancelWhenOutside: PropTypes.bool,
  hitSlop: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      vertical: PropTypes.number,
      horizontal: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  ]),
  onGestureEvent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onHandlerStateChange: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onBegan: PropTypes.func,
  onFailed: PropTypes.func,
  onCancelled: PropTypes.func,
  onActivated: PropTypes.func,
  onEnded: PropTypes.func,
};

export default GestureHandlerPropTypes;
