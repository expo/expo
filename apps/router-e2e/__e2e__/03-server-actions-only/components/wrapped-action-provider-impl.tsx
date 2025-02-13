import 'server-only';

import { createActionProvider } from './wrap-actions';
import { two } from './two-action';

export const WrappedActionProvider = createActionProvider({
  actions: {
    one: async function () {
      'use server';

      return 'one!';
    },
    two,
  },
});
