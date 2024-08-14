let LoadingView: typeof import('react-native/Libraries/Utilities/LoadingView').default;

try {
  LoadingView = require('react-native/Libraries/Utilities/LoadingView');
} catch {
  // In react-native 0.75.0 LoadingView was renamed to DevLoadingView
  try {
    LoadingView = require('react-native/Libraries/Utilities/DevLoadingView');
  } catch {}
}

export default LoadingView;
