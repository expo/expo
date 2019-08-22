export default class RelapseError extends Error {
  constructor(type, message) {
    super(`[expo-relapse][${type}]: ${message}`);
  }
}
