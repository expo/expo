export const attachRecoveredProps = (props) => {
    try {
        // Optionally import expo-error-recovery
        const { recoveredProps } = require('expo-error-recovery');
        return {
            ...props,
            exp: { ...props.exp, errorRecovery: recoveredProps },
        };
    }
    catch { }
    return props;
};
//# sourceMappingURL=RecoveryProps.js.map