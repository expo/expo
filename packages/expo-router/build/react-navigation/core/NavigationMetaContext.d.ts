import * as React from 'react';
/**
 * Context with additional metadata to pass to child navigator in a screen.
 * For example, child native stack to know it's inside native tabs.
 * So it doesn't implement features such as `popToTop` that are handled by native tabs.
 *
 * Consumers should not make any assumptions about the shape of the object.
 * It can be different depending on the navigator and may change without notice.
 * This is not intended to be used by application code.
 */
export declare const NavigationMetaContext: React.Context<object | undefined>;
//# sourceMappingURL=NavigationMetaContext.d.ts.map