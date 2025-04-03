/**
 * This file is used to check the types of environment variables that are defined in the `env.d.ts` file.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;
type AssertIsString<T> = [T] extends [string] ? true : never;
type AssertNotAny<T> = IsAny<T> extends true ? false : true;
type AssertIsNotAnyString<T> = AssertNotAny<T> extends true ? AssertIsString<T> : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const expectEnvExpoPublicTest: AssertIsNotAnyString<typeof process.env.EXPO_PUBLIC_TEST> = true;
