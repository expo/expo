import { createPages } from './create-pages';

export default createPages(async () => {
  // noop the router for client-only mode. This ensures we skip loading the routes in react-server mode.
});
