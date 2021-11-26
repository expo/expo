import { PanResponder } from 'react-native';
import {
  extractedProps,
  ResponderInstanceProps,
  ResponderProps,
} from './types';

const responderKeys = Object.keys(PanResponder.create({}).panHandlers);
const numResponderKeys = responderKeys.length;

export default function extractResponder(
  o: extractedProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: { [x: string]: any } & ResponderProps,
  ref: ResponderInstanceProps,
) {
  const {
    onPress,
    disabled,
    onPressIn,
    onPressOut,
    onLongPress,
    delayPressIn,
    delayPressOut,
    delayLongPress,
    pointerEvents,
  } = props;

  let responsible = false;
  for (let i = 0; i < numResponderKeys; i++) {
    const key = responderKeys[i];
    const value = props[key];
    if (value) {
      responsible = true;
      o[key] = value;
    }
  }

  if (pointerEvents) {
    o.pointerEvents = pointerEvents;
  }

  const hasTouchableProperty =
    disabled != null ||
    onPress ||
    onPressIn ||
    onPressOut ||
    onLongPress ||
    delayPressIn ||
    delayPressOut ||
    delayLongPress;

  if (hasTouchableProperty) {
    responsible = true;
    o.onResponderMove = ref.touchableHandleResponderMove;
    o.onResponderGrant = ref.touchableHandleResponderGrant;
    o.onResponderRelease = ref.touchableHandleResponderRelease;
    o.onResponderTerminate = ref.touchableHandleResponderTerminate;
    o.onStartShouldSetResponder = ref.touchableHandleStartShouldSetResponder;
    o.onResponderTerminationRequest =
      ref.touchableHandleResponderTerminationRequest;
  }

  if (responsible) {
    o.responsible = true;
  }
}
