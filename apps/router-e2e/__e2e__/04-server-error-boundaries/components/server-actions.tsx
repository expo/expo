'use server';

export async function actionThrowsErrorAsync() {
  throw new Error('Server error');
}
