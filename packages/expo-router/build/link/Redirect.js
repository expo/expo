"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redirect = void 0;
const react_1 = require("react");
const hooks_1 = require("../hooks");
const useFocusEffect_1 = require("../useFocusEffect");
const useScreens_1 = require("../useScreens");
const Navigator_1 = require("../views/Navigator");
/**
 * Redirects to the `href` as soon as the component is mounted.
 *
 * @example
 * ```tsx
 * import { View, Text } from 'react-native';
 * import { Redirect } from 'expo-router';
 *
 * export default function Page() {
 *  const { user } = useAuth();
 *
 *  if (!user) {
 *    return <Redirect href="/login" />;
 *  }
 *
 *  return (
 *    <View>
 *      <Text>Welcome Back!</Text>
 *    </View>
 *  );
 * }
 * ```
 */
function Redirect({ href, push, dismissTo, navigate, relativeToDirectory, withAnchor, }) {
    const router = (0, hooks_1.useRouter)();
    const event = push
        ? 'push'
        : dismissTo
            ? 'dismissTo'
            : navigate
                ? 'navigate'
                : 'replace';
    (0, useFocusEffect_1.useFocusEffect)(() => {
        try {
            router[event](href, { relativeToDirectory, withAnchor });
        }
        catch (error) {
            console.error(error);
        }
    });
    return (0, react_1.useContext)(useScreens_1.IsLayoutContext) ? <Navigator_1.Slot /> : null;
}
exports.Redirect = Redirect;
//# sourceMappingURL=Redirect.js.map