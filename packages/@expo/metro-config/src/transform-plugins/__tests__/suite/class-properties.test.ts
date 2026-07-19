import { makeEval } from './utils';

const exec = makeEval();

it('live rewrite', () => {
  const mod = exec({
    anywhere: `
      export const test1 = 'test1';
      export const test2 = 'test2';
      export const test3 = 'test3';
      export const test4 = 'test4';
      export const test5 = () => 'test5';
      export const test6 = 'test6';
      export const test7 = 'test7';
      export const test8 = 'test8';
      export const test9 = 'test9';
    `,
    entry: `
      import {test1, test2, test3, test4, test5, test6, test7, test8, test9} from 'anywhere';

      export class Example {
        #test1 = test1;
        test2 = test2;
        #test3() { return test3; }
        test4() { return test4; }
        get #test5() { return test5; }
        get test6() { return test6; }

        #test7 = this.#test1;
        #test8() { return this.#test3(); }
        get #test9() { return this.#test5(); }

        toJSON() {
          return {
            test1: this.#test1,
            test2: this.test2,
            test3: this.#test3(),
            test4: this.test4(),
            test5: this.#test5(),
            test6: this.test6,
            test7: this.#test7,
            test8: this.#test8(),
            test9: this.#test9,
          };
        }
      }
    `,
  });
  expect(mod).toEqual({
    exports: {
      Example: expect.any(Function),
    },
    requests: ['anywhere'],
  });
  const { Example } = mod.exports;
  const obj = new Example();
  expect(obj.toJSON()).toMatchInlineSnapshot(`
    {
      "test1": "test1",
      "test2": "test2",
      "test3": "test3",
      "test4": "test4",
      "test5": "test5",
      "test6": "test6",
      "test7": "test1",
      "test8": "test3",
      "test9": "test5",
    }
  `);
});

it('private', () => {
  const mod = exec(`
    export default class Example {
      #property = this;
    }
  `);
  expect(mod).toEqual({
    exports: {
      default: expect.any(Function),
    },
    requests: [],
  });
  expect(mod.exports.default.name).toBe('Example');
  expect(new mod.exports.default()).not.toBe(undefined);
});

it('public', () => {
  const mod = exec(`
    export default class Example {
      property = this;
    }
  `);
  expect(mod).toEqual({
    exports: {
      default: expect.any(Function),
    },
    requests: [],
  });
  const example = new mod.exports.default();
  expect(example.property).toBe(example);
});
