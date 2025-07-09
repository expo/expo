'use server';

import 'server-only';

export async function addAsync(a, b) {
  return a + b;
}

// TODO: Add support for default exports
// export default async function subAsync(a, b) {
//   return a - b;
// }
