import type { ImperativeRouter } from './global-state/router';
import { router as internalRouter } from './global-state/router';

export type { ImperativeRouter };
// Hide internal `goBack` and `linkTo` methods from the public API and typedoc.
export const router: ImperativeRouter = internalRouter;
