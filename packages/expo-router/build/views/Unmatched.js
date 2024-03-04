// Copyright © 2024 650 Industries.
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unmatched = void 0;
const expo_linking_1 = require("expo-linking");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const hooks_1 = require("../hooks");
const Link_1 = require("../link/Link");
const useNavigation_1 = require("../useNavigation");
const useLayoutEffect = typeof window !== 'undefined' ? react_1.default.useLayoutEffect : function () { };
function NoSSR({ children }) {
    const [render, setRender] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        setRender(true);
    }, []);
    if (!render) {
        return null;
    }
    return <>{children}</>;
}
/** Default screen for unmatched routes. */
function Unmatched() {
    const router = (0, hooks_1.useRouter)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const pathname = (0, hooks_1.usePathname)();
    const url = (0, expo_linking_1.createURL)(pathname);
    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Not Found',
        });
    }, [navigation]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text role="heading" aria-level={1} style={styles.title}>
        Unmatched Route
      </react_native_1.Text>
      <react_native_1.Text role="heading" aria-level={2} style={styles.subtitle}>
        Page could not be found.{' '}
        <react_native_1.Text onPress={() => {
            if (router.canGoBack()) {
                router.back();
            }
            else {
                router.replace('/');
            }
        }} style={styles.link}>
          Go back.
        </react_native_1.Text>
      </react_native_1.Text>

      <NoSSR>
        <Link_1.Link href={pathname} replace style={styles.link}>
          {url}
        </Link_1.Link>
      </NoSSR>

      <Link_1.Link href="/_sitemap" replace style={[styles.link, { marginTop: 8 }]}>
        Sitemap
      </Link_1.Link>
    </react_native_1.View>);
}
exports.Unmatched = Unmatched;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: 36,
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomColor: '#323232',
        borderBottomWidth: 1,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'white',
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
    },
    link: { color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
//# sourceMappingURL=Unmatched.js.map