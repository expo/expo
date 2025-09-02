import { Children, cloneElement, isValidElement, useEffect } from 'react';
import { View, Text } from 'react-native';
const swiftUINestingMarker = {
    __expo_isDirectlyInsideSwiftUIHierarchy: true,
};
export function markChildrenAsNestedInSwiftUI(children) {
    return Children.map(children, (child) => {
        if (isValidElement(child)) {
            return cloneElement(child, swiftUINestingMarker);
        }
        return child;
    });
}
export function isMissingHost(props) {
    return !props.__expo_isDirectlyInsideSwiftUIHierarchy;
}
export function MissingHostErrorView(props) {
    useEffect(() => {
        console.warn(`A SwiftUI view ${props.componentName} is inserted as a child of a standard UIView.\nDouble check that in JSX you have wrapped your component with <Host> from '@expo/ui/swift-ui'.\n\nimport { Host } from '@expo/ui/swift-ui'\n\n<Host matchContents style={ ... }>\n  <${props.componentName} ... />\n</Host>`);
    }, []);
    return (<View style={{
            flex: 1,
            minWidth: 120,
            minHeight: 70,
            backgroundColor: 'red',
        }}>
      <Text style={{ fontWeight: 'bold', fontSize: 11 }}>
        A SwiftUI view {props.componentName} is inserted as a child of a standard UIView. More info
        in console.
      </Text>
    </View>);
}
//# sourceMappingURL=missingHostUtils.js.map