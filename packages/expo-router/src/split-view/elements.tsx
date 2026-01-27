import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Split } from 'react-native-screens/experimental';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return (
    <Split.Column>
      <SafeAreaProvider>{props.children}</SafeAreaProvider>
    </Split.Column>
  );
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <Split.Inspector>{props.children}</Split.Inspector>;
}
