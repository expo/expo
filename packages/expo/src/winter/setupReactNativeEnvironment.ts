// Platform variants of this file pick the entry
// that the host React Native package for that platform ships.
try {
  require('react-native/setup-env');
} catch {
  // NOTE: Fallback preserved for out-of-tree platforms on React Native < 0.87
  require('react-native/Libraries/Core/InitializeCore');
}
