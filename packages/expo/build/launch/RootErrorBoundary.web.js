import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
export default class RootErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            error: null,
        };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        console.error(error);
        return { error };
    }
    render() {
        if (this.state.error) {
            return (React.createElement(View, { style: styles.container },
                React.createElement(Text, { style: styles.warningIcon }, "\u26A0\uFE0F"),
                React.createElement(Text, { style: [styles.paragraph, { color: '#000' }] }, "A fatal error was encountered while rendering the root component."),
                React.createElement(Text, { style: styles.paragraph }, "Review your application logs for more information, and reload the app when the issue is resolved. In production, your app would have crashed.")));
        }
        else {
            return this.props.children;
        }
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paragraph: {
        marginBottom: 10,
        textAlign: 'center',
        marginHorizontal: 30,
        maxWidth: 350,
        fontSize: 15,
        color: '#888',
    },
    warningIcon: {
        fontSize: 40,
        marginBottom: 20,
    },
});
//# sourceMappingURL=RootErrorBoundary.web.js.map