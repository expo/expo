import { Split } from '../optional-libraries/react-native-screens';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { getSplitColumnChildren } from './elements';
import type { SplitViewImplementationProps } from './split-view';

export function RNSSplitView({
  columns,
  inspectors,
  main,
  ...hostProps
}: SplitViewImplementationProps) {
  // The key is needed, because number of columns cannot be changed dynamically
  return (
    <IsWithinNativeNavigator value>
      <Split.Host key={columns.length + inspectors.length} {...hostProps}>
        {columns.map((column, index) => (
          <Split.Column key={index}>{getSplitColumnChildren(column.children)}</Split.Column>
        ))}
        <Split.Column>{main}</Split.Column>
        {inspectors.map((inspector, index) => (
          <Split.Inspector key={index}>{inspector.children}</Split.Inspector>
        ))}
      </Split.Host>
    </IsWithinNativeNavigator>
  );
}
