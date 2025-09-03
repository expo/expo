export let foo = 1n;

export let bar = foo++;

export let baz = ++bar;

expect(foo).toBe(2n);
expect(bar).toBe(2n);
expect(baz).toBe(2n);

export { foo as foofoo, bar as barbar };
export { baz as bazbaz };

--foo;
bar--;
baz--;
