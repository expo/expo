import React from 'react';
import GenericTouchable from './GenericTouchable';

const TouchableWithoutFeedback = React.forwardRef((props, ref) => (
  <GenericTouchable ref={ref} {...props} />
));

TouchableWithoutFeedback.defaultProps = GenericTouchable.defaultProps;

TouchableWithoutFeedback.propTypes = GenericTouchable.publicPropTypes;

export default TouchableWithoutFeedback;
