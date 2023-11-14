// NOTE(EvanBacon): `react-native-web` adds a extra `div`s around the root HTML, these
// make static rendering much harder as we expect the root element to be `<html>`.
// This resolution will alias to a simple in-out component to avoid the extra HTML.
function AppContainer({ children }) {
  return children;
}

if (process.env.NODE_ENV !== 'production') {
  AppContainer.displayName = 'AppContainer';
}

export default AppContainer;
