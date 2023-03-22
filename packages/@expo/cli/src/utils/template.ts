/**
 * Simple unsafe interpolation for template strings. Does NOT escape values.
 *
 * Arguments can be named or numeric.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
 *
 * @example
 * const t1Closure = unsafeTemplate`${0}${1}${0}!`;
 * // const t1Closure = unsafeTemplate(["","","","!"],0,1,0);
 * t1Closure("Y", "A"); // "YAY!"
 *
 * @example
 * const t2Closure = unsafeTemplate`${0} ${"foo"}!`;
 * // const t2Closure = unsafeTemplate([""," ","!"],0,"foo");
 * t2Closure("Hello", { foo: "World" }); // "Hello World!"
 *
 * @example
 * const t3Closure = unsafeTemplate`I'm ${"name"}. I'm almost ${"age"} years old.`;
 * // const t3Closure = unsafeTemplate(["I'm ", ". I'm almost ", " years old."], "name", "age");
 * t3Closure("foo", { name: "MDN", age: 30 }); // "I'm MDN. I'm almost 30 years old."
 * t3Closure({ name: "MDN", age: 30 }); // "I'm MDN. I'm almost 30 years old."
 */
export function unsafeTemplate(strings: TemplateStringsArray, ...keys: (string | number)[]) {
  return (
    ...values: (string | number)[] | [...(string | number)[], Record<string | number, string>]
  ) => {
    const lastValue = values[values.length - 1];
    const dict = typeof lastValue === 'object' ? lastValue : {};
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = typeof key === 'number' && Number.isInteger(key) ? values[key] : dict[key];
      result.push(value as string, strings[i + 1]);
    });
    return result.join('');
  };
}
