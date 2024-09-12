declare module 'bplist-creator' {
  function createPlist(target: any): Buffer;
  export = createPlist;
}
