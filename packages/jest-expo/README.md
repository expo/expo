# jest-expo

A [Jest](https://facebook.github.io/jest/) preset to painlessly test your Expo apps.

If you have problems with the code in this repository, please file issues & bug reports
at https://github.com/expo/expo. Thanks!

### Installation

- `yarn add jest-expo --dev` or `npm i jest-expo --save-dev`
- Add the following config to `package.json`:

  ```js
  "scripts": {
    "test": "node_modules/.bin/jest",
    "test:watch": "node_modules/.bin/jest --watch"
  },
  "jest": {
    "preset": "jest-expo"
  }
  ```
  Or you can use this code if it's dosen't run your test:
    ```js
  "scripts": {
    "test": "node ./node_modules/jest/bin/jest.js",
    "test:watch": "node ./node_modules/jest/bin/jest.js --watch",
  },
  "jest": {
    "preset": "jest-expo"
  }

- Create a `__tests__` directory anywhere you like and a `Example-test.js` file inside of it, and add this code:

  ```js
  it('works', () => {
    expect(1).toBe(1);
  });
  ```

- Run `npm test` and it should pass or run `npm run test:watch` to watch your tests

### Learning Jest

[Read the excellent documentation](https://facebook.github.io/jest/)
