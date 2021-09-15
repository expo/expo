import { hashPath } from '../shared';

test('hashPath() returns unique identifier', () => {
  const id1 = hashPath('/this/is/1my-component1.stories.tsx');
  const id2 = hashPath('/this/is/1my-component2.stories.tsx');

  expect(id1).not.toEqual(id2);
});

test('hashPath() returns valid js identifier for paths with non-valid js characters', () => {
  const id = hashPath('/123/this/is/132my-component132.stories123.tsx');
  const template = `const ${id} = '123'`;
  // eslint-disable-next-line
  expect(() => eval(template)).not.toThrowError();
});

test('hashPath() does not clash on _ and - characters', () => {
  const id1 = hashPath('/123/this/is/132my-component132.stories123.tsx');
  const id2 = hashPath('/123/this/is/132my_component132.stories123.tsx');
  expect(id1).not.toEqual(id2);
});
