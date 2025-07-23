'use server';

// eslint-disable-next-line import/no-unresolved
import 'completely-missing';

export async function actionThrowsBundlerErrorAsync() {
  throw new Error('Server error');
}
