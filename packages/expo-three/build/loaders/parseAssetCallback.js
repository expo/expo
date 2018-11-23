function isFunction(functionToCheck) {
    return (functionToCheck && {}.toString.call(functionToCheck) === '[object Function]');
}
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
const parseAssetCallback = (name, callbackOrDictionary) => {
    if (isFunction(callbackOrDictionary)) {
        return callbackOrDictionary(name);
    }
    else if (isObject(callbackOrDictionary)) {
        if (name in callbackOrDictionary) {
            return callbackOrDictionary[name];
        }
        else {
            console.error("getAssetAsync: object `callbackOrDictionary` doesn't contain key", name);
        }
    }
    else {
        console.error('getAssetAsync: prop `callbackOrDictionary` must be a function or object');
    }
};
export default parseAssetCallback;
//# sourceMappingURL=parseAssetCallback.js.map