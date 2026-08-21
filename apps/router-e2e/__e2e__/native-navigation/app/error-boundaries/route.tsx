import { createErrorBoundary, ThrowingRoute } from './components';

export const unstable_settings = {
  screenErrorBoundary: createErrorBoundary('route'),
};

export default ThrowingRoute;
