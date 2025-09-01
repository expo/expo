export let foo;
export {foo as bar}

for (foo of []) {}
for (foo in []) {}
for (foo of []) {
    let foo;
}
for ({foo} of []) {}
for ({foo} of []) {
    let foo;
}
for ({test: {foo}} of []) {}
for ([foo, [...foo]] of []) {}
for ([foo, [...foo]] of []) {
    let foo;
}

for (foo of []) ;

{
    let foo;
    for(foo of []) {}
}
