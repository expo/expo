import { requireNativeView } from 'expo';
const TextNativeView = requireNativeView('ExpoUI', 'TextView');
function transformTextProps(props) {
    const { children, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
    };
}
export function Text(props) {
    return <TextNativeView {...transformTextProps(props)}/>;
}
//# sourceMappingURL=Text.js.map