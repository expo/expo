var Obj = {
  baz: 123,
  get boo() { throw new Error('Should never be triggered'); }
}

module.exports = Obj;
