"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBottomAccessoryEnvironment = exports.BottomAccessoryEnvironmentContext = void 0;
const react_1 = require("react");
exports.BottomAccessoryEnvironmentContext = (0, react_1.createContext)(undefined);
/**
 * A hook which returns the bottom accessory environment for given component.
 *
 * Note, that there can be two copies of the same component rendered for different environments.
 * The hook will ensure that component with correct environment is displayed.
 *
 * Because two instances of the component will exist simultaneously, **any state kept
 * inside the component will not be shared between the regular and inline versions**.
 * If your accessory needs synchronized or persistent state you must store that state
 * outside of bottom accessory component (e.g. passing via props or using context).
 *
 * Don't pass the environment obtained using this hook up the tree.
 *
 * @example
 *
 * ```tsx
 * import { NativeTabs, useBottomAccessoryEnvironment } from 'expo-router/unstable-native-tabs';
 *
 * // This component will have two copies rendered, one for `inline` and one for `regular` environment
 * function AccessoryContent(props) {
 *   const environment = useBottomAccessoryEnvironment();
 *   if (environment === 'inline') {
 *     return <InlineAccessoryComponent {...props} />;
 *   }
 *   return <RegularAccessoryComponent {...props} />;
 * }
 *
 * export default function Layout(){
 *   const [isPlaying, setIsPlaying] = useState(false);
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.BottomAccessory>
 *         <AccessoryContent isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
 *       </NativeTabs.BottomAccessory>
 *       <NativeTabs.Trigger name="index" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 *
 * @platform iOS 26+
 */
const useBottomAccessoryEnvironment = () => {
    const value = (0, react_1.use)(exports.BottomAccessoryEnvironmentContext);
    if (!value) {
        throw new Error('useBottomAccessoryEnvironment can only be used within a <NativeTabs.BottomAccessory> component.');
    }
    return value;
};
exports.useBottomAccessoryEnvironment = useBottomAccessoryEnvironment;
//# sourceMappingURL=hooks.js.map