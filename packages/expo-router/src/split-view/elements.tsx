import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplitViewScreen } from 'react-native-screens/experimental';

export interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return (
    <SplitViewScreen.Column>
      <SafeAreaProvider>{props.children}</SafeAreaProvider>
    </SplitViewScreen.Column>
  );
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props: SplitViewColumnProps) {
  return <SplitViewScreen.Inspector>{props.children}</SplitViewScreen.Inspector>;
}
