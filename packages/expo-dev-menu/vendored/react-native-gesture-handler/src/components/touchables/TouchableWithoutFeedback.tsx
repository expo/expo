import * as React from 'react';
import { PropsWithChildren } from 'react';
import GenericTouchable, { GenericTouchableProps } from './GenericTouchable';

const TouchableWithoutFeedback = React.forwardRef<
  GenericTouchable,
  PropsWithChildren<GenericTouchableProps>
>((props, ref) => <GenericTouchable ref={ref} {...props} />);

TouchableWithoutFeedback.defaultProps = GenericTouchable.defaultProps;

export default TouchableWithoutFeedback;
