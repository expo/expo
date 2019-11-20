let shouldThrowAnErrorOutsideOfExpoValue = true;
/**
 * @param value Should 'expo' validate the environment against Constants.expoVersion
 */
export function _setShouldThrowAnErrorOutsideOfExpo(value) {
    shouldThrowAnErrorOutsideOfExpoValue = value;
}
/**
 * Should 'expo' validate the environment against Constants.expoVersion
 */
export function shouldThrowAnErrorOutsideOfExpo() {
    return shouldThrowAnErrorOutsideOfExpoValue;
}
//# sourceMappingURL=validatorState.js.map