import { SplitViewScreen } from 'react-native-screens/experimental';

interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <SplitViewScreen.Column>{props.children}</SplitViewScreen.Column>;
}

interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewInspector(props: SplitViewColumnProps) {
  return <SplitViewScreen.Inspector>{props.children}</SplitViewScreen.Inspector>;
}
