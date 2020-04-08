let AsyncStorage;
try {
    AsyncStorage = require('react-native').AsyncStorage;
}
catch (_) {
    AsyncStorage = require('@react-native-community/async-storage').default;
}
export function setItemAsync(name, value) {
    return AsyncStorage.setItem(name, value);
}
export function deleteItemAsync(name) {
    return AsyncStorage.removeItem(name);
}
export function getItemAsync(name) {
    return AsyncStorage.getItem(name) ?? null;
}
//# sourceMappingURL=Storage.js.map