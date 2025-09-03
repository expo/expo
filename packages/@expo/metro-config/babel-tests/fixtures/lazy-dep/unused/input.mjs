import { a } from "a";
import b from "b";
import * as c from "c";

// This is included explicitly for the side effects, so we keep it
import "d";

// Only f is unused, we must keep the require call
import { e, f } from "e";
e;

// The first import is unused, but we keep the require call
// because of the second one
import { g } from "g";
import { h } from "g";
h;
