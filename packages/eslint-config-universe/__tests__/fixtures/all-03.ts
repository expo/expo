let tsUnused1 = 0;

function tsUnused2() {
  let x: any = 'hi';
  let asCast = x as string;
  let angleBracketCast = <string>x;
}
