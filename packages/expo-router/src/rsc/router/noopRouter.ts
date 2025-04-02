import { createExpoPages } from './create-expo-pages';

export default createExpoPages(async () => {
  // noop the router for client-only mode. This ensures we skip loading the routes in react-server mode.
});
