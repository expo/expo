"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollToTop = useScrollToTop;
const React = __importStar(require("react"));
const core_1 = require("../core");
function getScrollableNode(ref) {
    if (ref.current == null) {
        return null;
    }
    if ('scrollToTop' in ref.current ||
        'scrollTo' in ref.current ||
        'scrollToOffset' in ref.current ||
        'scrollResponderScrollTo' in ref.current) {
        // This is already a scrollable node.
        return ref.current;
    }
    else if ('getScrollResponder' in ref.current) {
        // If the view is a wrapper like FlatList, SectionList etc.
        // We need to use `getScrollResponder` to get access to the scroll responder
        return ref.current.getScrollResponder();
    }
    else if ('getNode' in ref.current) {
        // When a `ScrollView` is wrapped in `Animated.createAnimatedComponent`
        // we need to use `getNode` to get the ref to the actual scrollview.
        // Note that `getNode` is deprecated in newer versions of react-native
        // this is why we check if we already have a scrollable node above.
        return ref.current.getNode();
    }
    else {
        return ref.current;
    }
}
function useScrollToTop(ref) {
    const navigation = React.useContext(core_1.NavigationContext);
    const route = (0, core_1.useRoute)();
    if (navigation === undefined) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    React.useEffect(() => {
        const tabNavigations = [];
        let currentNavigation = navigation;
        // If the screen is nested inside multiple tab navigators, we should scroll to top for any of them
        // So we need to find all the parent tab navigators and add the listeners there
        while (currentNavigation) {
            if (currentNavigation.getState().type === 'tab') {
                tabNavigations.push(currentNavigation);
            }
            currentNavigation = currentNavigation.getParent();
        }
        if (tabNavigations.length === 0) {
            return;
        }
        const unsubscribers = tabNavigations.map((tab) => {
            return tab.addListener(
            // We don't wanna import tab types here to avoid extra deps
            // in addition, there are multiple tab implementations
            // @ts-expect-error the `tabPress` event is only available when navigation type is tab
            'tabPress', (e) => {
                // We should scroll to top only when the screen is focused
                const isFocused = navigation.isFocused();
                // In a nested stack navigator, tab press resets the stack to first screen
                // So we should scroll to top only when we are on first screen
                const isFirst = tabNavigations.includes(navigation) ||
                    navigation.getState().routes[0].key === route.key;
                // Run the operation in the next frame so we're sure all listeners have been run
                // This is necessary to know if preventDefault() has been called
                requestAnimationFrame(() => {
                    const scrollable = getScrollableNode(ref);
                    if (isFocused && isFirst && scrollable && !e.defaultPrevented) {
                        if ('scrollToTop' in scrollable) {
                            scrollable.scrollToTop();
                        }
                        else if ('scrollTo' in scrollable) {
                            scrollable.scrollTo({ y: 0, animated: true });
                        }
                        else if ('scrollToOffset' in scrollable) {
                            scrollable.scrollToOffset({ offset: 0, animated: true });
                        }
                        else if ('scrollResponderScrollTo' in scrollable) {
                            scrollable.scrollResponderScrollTo({ y: 0, animated: true });
                        }
                    }
                });
            });
        });
        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [navigation, ref, route.key]);
}
//# sourceMappingURL=useScrollToTop.js.map