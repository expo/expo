// This method needs to be in a separate file because react-native-reanimated
// import wrapped in try catch does not work correctly with inlineRequires option
// in metro.config.js
//
// It looks like in generated bundle "react-native-reanimated" is not present
// in _dependencyMap, but references to it count it as if it was, e.g. bundle contains
// a line "(0, _$$_REQUIRE(_dependencyMap[15], "./GLUtils").configureLogging)(gl);"
// but dependencyMap contains only 15 elements
export function createWorkletContextProvider() {
    try {
        // reanimated needs to be imported before any workletized code
        // is created, but we don't want to make it dependency on expo-gl.
        require('react-native-reanimated');
        return (contextId) => {
            'worklet';
            return global.__EXGLContexts?.[String(contextId)];
        };
    }
    catch {
        return () => {
            throw new Error('Worklet runtime is not available');
        };
    }
}
//# sourceMappingURL=GLWorkletContextProvider.js.map