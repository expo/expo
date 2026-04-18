import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Split } from 'react-native-screens/experimental';
export function SplitViewColumn(props) {
    return (<Split.Column>
      <SafeAreaProvider>{props.children}</SafeAreaProvider>
    </Split.Column>);
}
/**
 * @platform iOS 26+
 */
export function SplitViewInspector(props) {
    return <Split.Inspector>{props.children}</Split.Inspector>;
}
//# sourceMappingURL=elements.js.map