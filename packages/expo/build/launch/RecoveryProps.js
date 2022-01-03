function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
export const attachRecoveredProps = (props)=>{
    try {
        // Optionally import expo-error-recovery
        const { recoveredProps  } = require('expo-error-recovery');
        return _objectSpread({}, props, {
            exp: _objectSpread({}, props.exp, {
                errorRecovery: recoveredProps
            })
        });
    } catch (e) {}
    return props;
};

//# sourceMappingURL=RecoveryProps.js.map