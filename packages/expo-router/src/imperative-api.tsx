import type { ImperativeRouter } from './global-state/router';
import { router as internalRouter } from './global-state/router';

export type { ImperativeRouter };
// Hide internal `goBack` and `linkTo` methods from the public API and typedoc.
// TODO(@ubax): Return promises from navigation methods that resolve when their transitions commit.
export const router: ImperativeRouter = internalRouter;
