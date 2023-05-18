/*
 * These tests simple smoke tests to ensure the core functionality is met.
 * If you need to go into more detail, create a new test file
 *
 * https://en.wikipedia.org/wiki/Smoke_testing_(software)
 */
import { render } from "@testing-library/react-native";
import React from "react";

import { StyleSheet } from "../runtime/native/stylesheet";
import { createMockComponent, registerCSS } from "./utils";

type TestSuite<T extends keyof CSSStyleDeclaration> = readonly [
  CSSStyleDeclaration[T],
  Record<string, unknown>
];

type TestSuites = {
  [K in string &
    keyof CSSStyleDeclaration as CamelToKebabCase<K>]: TestSuite<K>;
};

type CamelToKebabCase<
  T extends string,
  A extends string = ""
> = T extends `${infer F}${infer R}`
  ? CamelToKebabCase<
      R,
      `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`
    >
  : A;

const A = createMockComponent();

afterEach(() => {
  StyleSheet.__reset();
});

const cases: Partial<TestSuites> = {
  color: ["red", { color: "rgba(255, 0, 0, 1)" }],
  "background-color": ["purple", { backgroundColor: "rgba(128, 0, 128, 1)" }],
};

test.each(Object.entries(cases))("%s", (key, [css, expected]) => {
  registerCSS(`.my-class { ${key}: ${css} }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual(expected);
});
