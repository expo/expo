// No exception should be thrown
import * as foo from "./moduleWithGetter";

expect(foo.baz).toBe(123);
expect(() => foo.boo).toThrow();
