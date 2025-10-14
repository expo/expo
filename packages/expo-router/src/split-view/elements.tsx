import { SplitViewScreen } from 'react-native-screens/experimental';

interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <SplitViewScreen.Column>{props.children}</SplitViewScreen.Column>;
}
