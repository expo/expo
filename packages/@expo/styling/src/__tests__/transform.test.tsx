import { render } from "@testing-library/react-native";
import React from "react";

import { StyleSheet } from "../runtime/native/stylesheet";
import { createMockComponent, registerCSS } from "./utils";

const A = createMockComponent();

afterEach(() => {
  StyleSheet.__reset();
});

test("translateX percentage", () => {
  registerCSS(`.my-class { width: 120px; transform: translateX(10%); }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({
    width: 120,
    transform: [{ translateX: 12 }],
  });
});

test("translateY percentage", () => {
  registerCSS(`.my-class { height: 120px; transform: translateY(10%); }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({
    height: 120,
    transform: [{ translateY: 12 }],
  });
});

test("rotate-180", () => {
  registerCSS(`
    .rotate-180 {
      --tw-rotate: 180deg;
      transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }
  `);

  render(<A className="rotate-180" />);

  expect(A).styleToEqual({
    transform: [
      {
        translateX: 0,
      },
      {
        rotate: "180deg",
      },
      {
        skewX: "0deg",
      },
      {
        skewY: "0deg",
      },
      {
        scaleX: 1,
      },
      {
        scaleY: 1,
      },
    ],
  });
});
