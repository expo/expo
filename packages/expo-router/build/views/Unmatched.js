import { StyleSheet, Text, View } from '@bacons/react-views';
import { createURL } from 'expo-linking';
import React from 'react';
import { usePathname, useRouter } from '../hooks';
import { Link } from '../link/Link';
import { useNavigation } from '../useNavigation';
const useLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : function () { };
function NoSSR({ children }) {
    const [render, setRender] = React.useState(false);
    React.useEffect(() => {
        setRender(true);
    }, []);
    if (!render) {
        return null;
    }
    return React.createElement(React.Fragment, null, children);
}
/** Default screen for unmatched routes. */
export function Unmatched() {
    const router = useRouter();
    const navigation = useNavigation();
    const pathname = usePathname();
    const url = createURL(pathname);
    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Not Found',
        });
    }, [navigation]);
    return (React.createElement(View, { style: styles.container },
        React.createElement(Text, { role: "heading", "aria-level": 1, style: styles.title }, "Unmatched Route"),
        React.createElement(Text, { role: "heading", "aria-level": 2, style: styles.subtitle },
            "Page could not be found.",
            ' ',
            React.createElement(Text, { onPress: () => {
                    if (router.canGoBack()) {
                        router.back();
                    }
                    else {
                        router.replace('/');
                    }
                }, style: styles.link }, "Go back.")),
        React.createElement(NoSSR, null,
            React.createElement(Link, { href: pathname, replace: true, style: styles.link }, url)),
        React.createElement(Link, { href: "/_sitemap", replace: true, style: [styles.link, { marginTop: 8 }] }, "Sitemap")));
}
const styles = StyleSheet.create({
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