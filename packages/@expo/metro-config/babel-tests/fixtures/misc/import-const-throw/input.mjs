import Foo from "foo";

import * as Bar from "bar";

import { Baz } from "baz";

Foo = 42;
Bar = 43;
Baz = 44;

({Foo} = {});
({Bar} = {});
({Baz} = {});

({prop: Foo} = {});
({prop: Bar} = {});
({prop: Baz} = {});

Foo += 2;
Bar += 2;
Baz += 2;

Foo >>>= 3;
Bar >>>= 3;
Baz >>>= 3;

Foo &&= 4;
Bar &&= 4;
Baz &&= 4;

--Foo;
--Bar;
--Baz;

Foo++;
Bar++;
Baz++;

for (Foo in {}) ;
for (Bar in {}) {}
for (Baz of []) {
	let Baz;
}

for ({Foo} in {}) {}
for ([Bar] in {}) {}
for ([...Baz] in {}) {}
