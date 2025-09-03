import foo from "foo";
import { default as foo2 } from "foo";
import { foo3 } from "foo";
import * as foo4 from "foo";

foo;
foo2;
foo3;
foo3();
foo3``;
foo3?.();
