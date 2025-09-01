import aDefault from "one";
import { aNamed } from "two";
import { orig as anAliased } from "three";
import * as aNamespace from "four";

console.log(aDefault);
console.log(aNamed);
console.log(anAliased);
console.log(aNamespace);

console.log(aDefault());
console.log(aNamed());
console.log(anAliased());
console.log(aNamespace());
