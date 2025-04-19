import { requireNativeView } from 'expo';
const LabelNativeView = requireNativeView('ExpoUI', 'LabelView');
/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props) {
    return <LabelNativeView {...props}/>;
}
//# sourceMappingURL=index.js.map