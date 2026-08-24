import { createErrorBoundary, ThrowingRoute } from '../../components/error-boundaries';

export const unstable_settings = {
  screenErrorBoundary: createErrorBoundary('route'),
};

export default ThrowingRoute;
