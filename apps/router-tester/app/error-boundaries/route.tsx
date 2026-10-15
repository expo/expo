import { createErrorBoundary, ThrowingRoute } from '../../components/error-boundaries';

export const ErrorBoundary = createErrorBoundary('route');

export default ThrowingRoute;
