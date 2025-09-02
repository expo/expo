import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const SectionNativeView = requireNativeView('ExpoUI', 'SectionView');
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props) {
    const { modifiers, children, ...restProps } = props;
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Section"/>;
    }
    return (<SectionNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} children={markChildrenAsNestedInSwiftUI(children)} {...restProps}/>);
}
//# sourceMappingURL=index.js.map