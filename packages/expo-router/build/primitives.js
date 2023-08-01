import { createNavigatorFactory } from '@react-navigation/core';
// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
export const { Screen, Group } = createNavigatorFactory({})();
//# sourceMappingURL=primitives.js.map