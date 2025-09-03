import { foo } from "x";

function f(foo) {
  foo = 2;
  [foo] = [];
  ({ foo } = {});
}


foo = 2;
[foo] = [];
({ foo } = {});
