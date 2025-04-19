async function test() {
  return Promise.resolve('blah');
}

export async function wat() {
  // await-thenable
  const createValue = () => 'value';
  await createValue();

  // no-confusing-void-expression
  console.log(alert('Are you sure?'));

  // no-misused-promises
  const promise = Promise.resolve('value');
  if (promise) {
    console.log('hi');
  }

  // no-floating-promises
  try {
    test(); // needs to be awaited, otherwise try/catch is useless.
  } catch {}
}
