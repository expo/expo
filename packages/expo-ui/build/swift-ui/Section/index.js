import { requireNativeView } from 'expo';
import { Host } from '../Host';
const SectionNativeView = requireNativeView('ExpoUI', 'SectionView');
/**
 * `<Section>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function SectionPrimitive(props) {
    return <SectionNativeView {...props}/>;
}
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props) {
    return (<Host style={props.style} matchContents>
      <SectionPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map