import { Split } from '../optional-libraries/react-native-screens';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{props.children}</Split.Column>;
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
