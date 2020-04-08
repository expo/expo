let AsyncStorage: any;

try {
  AsyncStorage = require('react-native').AsyncStorage;
} catch (_) {
  AsyncStorage = require('@react-native-community/async-storage').default;
}

export function setItemAsync(name: string, value: string): Promise<void> {
  return AsyncStorage.setItem(name, value);
}
export function deleteItemAsync(name: string): Promise<void> {
  return AsyncStorage.removeItem(name);
}
export function getItemAsync(name: string): Promise<string | null> {
  return AsyncStorage.getItem(name) ?? null;
}
