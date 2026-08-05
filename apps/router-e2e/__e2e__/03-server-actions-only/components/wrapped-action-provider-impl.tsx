import 'server-only';
import { two } from './two-action';
import { createActionProvider } from './wrap-actions';

export const WrappedActionProvider = createActionProvider({
  actions: {
    async one() {
      'use server';

      return 'one!';
    },
    two,
  },
});
