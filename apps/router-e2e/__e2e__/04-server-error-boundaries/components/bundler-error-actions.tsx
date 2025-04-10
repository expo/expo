'use server';

import 'completely-missing';

export async function actionThrowsBundlerErrorAsync() {
  throw new Error('Server error');
}
