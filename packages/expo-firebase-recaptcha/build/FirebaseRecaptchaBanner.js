import * as React from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
export default function FirebaseRecaptchaBanner(props) {
    const { textStyle, linkStyle, ...otherProps } = props;
    return (React.createElement(View, { ...otherProps },
        React.createElement(Text, { style: [styles.text, textStyle] },
            "This app is protected by reCAPTCHA and the Google",
            React.createElement(Text, { style: [styles.link, linkStyle], onPress: () => Linking.openURL('https://policies.google.com/privacy') }, "\u00A0Privacy Policy\u00A0"),
            "and",
            React.createElement(Text, { style: [styles.link, linkStyle], onPress: () => Linking.openURL('https://policies.google.com/terms') }, "\u00A0Terms of Service\u00A0"),
            "apply.")));
}
const styles = StyleSheet.create({
    content: {
        ...StyleSheet.absoluteFillObject,
    },
    text: {
        fontSize: 13,
        opacity: 0.5,
    },
    link: {
        color: 'blue',
    },
});
//# sourceMappingURL=FirebaseRecaptchaBanner.js.map