import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplitViewScreen } from 'react-native-screens/experimental';

interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return (
    <SplitViewScreen.Column>
      <SafeAreaProvider>{props.children}</SafeAreaProvider>
    </SplitViewScreen.Column>
  );
}

interface SplitViewColumnProps {
  children?: React.ReactNode;
}

export function SplitViewInspector(props: SplitViewColumnProps) {
  return <SplitViewScreen.Inspector>{props.children}</SplitViewScreen.Inspector>;
}
