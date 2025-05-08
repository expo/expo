const tsUnused1 = 0;

function tsUnused2() {
  const x: any = 'hi';
  const asCast = x as string;
  const angleBracketCast = <string>x;
}
