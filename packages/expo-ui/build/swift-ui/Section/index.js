import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const SectionNativeView = requireNativeView('ExpoUI', 'SectionView');
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export function Section(props) {
    const { modifiers, ...restProps } = props;
    return (<SectionNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps}/>);
}
//# sourceMappingURL=index.js.map