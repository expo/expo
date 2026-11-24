import ErrorPage from '~/pages/_error';

import { createPageRouteWithDefaultHead } from '../routes';

// The error page sets its head tags only after it runs in the browser.
export default createPageRouteWithDefaultHead(ErrorPage);
