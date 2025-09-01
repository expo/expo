// No exception should be thrown
import Foo, { baz } from "./moduleWithGetter";

expect(baz).toBe(123);
