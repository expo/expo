import dep1 from "./dep1.js";
import dep2 from "./dep2.js";
import * as dep3 from "./dep3.js";
import * as dep4 from "./dep4.js";
import dep5 from "./dep5.js";
import dep6 from "./dep6.js";
import { named as dep7 } from "./dep7.js";
import { named as dep8 } from "./dep8.js";

expect(typeof dep1).toBe("function");
expect(dep1()).toBe(1);

expect(typeof dep2).toBe("function");
expect(dep2()).toBe(2);

expect(typeof dep3).toBe("object");
expect(typeof dep3.default).toBe("function");
expect(dep3.default()).toBe(3);

expect(typeof dep4).toBe("object");
expect(typeof dep4.default).toBe("function");
expect(dep4.default()).toBe(4);

expect(typeof dep5).toBe("object");
expect(typeof dep5.default).toBe("function");
expect(dep5.default()).toBe(5);

expect(typeof dep6).toBe("object");
expect(typeof dep6.default).toBe("function");
expect(dep6.default()).toBe(6);

expect(typeof dep7).toBe("function");
expect(dep7()).toBe(7);

expect(typeof dep8).toBe("function");
expect(dep8()).toBe(8);
