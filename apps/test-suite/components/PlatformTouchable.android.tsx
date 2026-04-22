import { TouchableNativeFeedback, type TouchableNativeFeedbackProps } from 'react-native';

export default function PlatformTouchable(props: TouchableNativeFeedbackProps) {
  return <TouchableNativeFeedback {...props} />;
}
