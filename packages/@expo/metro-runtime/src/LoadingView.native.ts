let LoadingView: typeof import('react-native/Libraries/Utilities/LoadingView').default;

try {
  LoadingView = require('react-native/Libraries/Utilities/LoadingView').default;
} catch {
  // In react-native 0.75.0 LoadingView was renamed to DevLoadingView
  LoadingView = require('react-native/Libraries/Utilities/DevLoadingView').default;
}

export default LoadingView;
