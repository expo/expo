import {
  matchDynamicName,
  matchDeepDynamicRouteName,
  getNameFromFilePath,
  matchGroupName,
  stripGroupSegmentsFromPath,
  matchArrayGroupName,
} from '../matchers';

describe(stripGroupSegmentsFromPath, () => {
  it(`strips group segments, preserving initial slash`, () => {
    expect(stripGroupSegmentsFromPath('/[[...foobar]]/(foo)/bar/[bax]/(other)')).toBe(
      '/[[...foobar]]/bar/[bax]'
    );
    expect(stripGroupSegmentsFromPath('(foo)/(bar)')).toBe('');
  });
});

describe(matchGroupName, () => {
  it(`matches`, () => {
    expect(matchGroupName('[[...foobar]]')).toEqual(undefined);
    expect(matchGroupName('[[foobar]]')).toEqual(undefined);
    expect(matchGroupName('[...foobar]')).toEqual(undefined);
    expect(matchGroupName('[foobar]')).toEqual(undefined);
    expect(matchGroupName('(foobar)')).toEqual('foobar');
    expect(matchGroupName('(foo,bar)')).toEqual('foo,bar');
    expect(matchGroupName('((foobar))')).toEqual('(foobar)');
    expect(matchGroupName('(...foobar)')).toEqual('...foobar');
    expect(matchGroupName('foobar')).toEqual(undefined);
    expect(matchGroupName('leading/foobar')).toEqual(undefined);
    expect(matchGroupName('leading/(foobar)')).toEqual('foobar');
    expect(matchGroupName('leading/((foobar))')).toEqual('(foobar)');
    expect(matchGroupName('leading/(...foobar)')).toEqual('...foobar');
    expect(matchGroupName('leading/(foo,bar)')).toEqual('foo,bar');
    expect(matchGroupName('leading/foobar/trailing')).toEqual(undefined);
    expect(matchGroupName('leading/(foobar)/trailing')).toEqual('foobar');
    expect(matchGroupName('leading/((foobar))/trailing')).toEqual('(foobar)');
    expect(matchGroupName('leading/(...foobar)/trailing')).toEqual('...foobar');
    expect(matchGroupName('leading/(foo,bar)/trailing)')).toEqual('foo,bar');
    expect(matchGroupName('leading/(foo,bar)/(fruit,apple)')).toEqual('foo,bar');
  });
});
describe(matchDynamicName, () => {
  it(`matches`, () => {
    expect(matchDynamicName('[[...foobar]]')).toEqual(undefined);
    expect(matchDynamicName('[[foobar]]')).toEqual(undefined);
    expect(matchDynamicName('[...foobar]')).toEqual(undefined);
    expect(matchDynamicName('[foobar]')).toEqual('foobar');
    expect(matchDynamicName('foobar')).toEqual(undefined);
  });
});

describe(matchDeepDynamicRouteName, () => {
  it(`matches`, () => {
    expect(matchDeepDynamicRouteName('[[...foobar]]')).toEqual(undefined);
    expect(matchDeepDynamicRouteName('[[foobar]]')).toEqual(undefined);
    expect(matchDeepDynamicRouteName('[...foobar]')).toEqual('foobar');
    expect(matchDeepDynamicRouteName('[foobar]')).toEqual(undefined);
    expect(matchDeepDynamicRouteName('foobar')).toEqual(undefined);
  });
});

describe(getNameFromFilePath, () => {
  it(`should return the name of the file`, () => {
    expect(getNameFromFilePath('./pages/home.tsx')).toBe('pages/home');
    expect(getNameFromFilePath('../pages/home.js')).toBe('pages/home');
    expect(getNameFromFilePath('./(home).jsx')).toBe('(home)');
    expect(getNameFromFilePath('../../../(pages)/[any]/[...home].ts')).toBe(
      '(pages)/[any]/[...home]'
    );
  });
});

describe(matchArrayGroupName, () => {
  it(`should not match routes without groups`, () => {
    expect(matchArrayGroupName('[[...foobar]]')).toEqual(undefined);
    expect(matchArrayGroupName('[[foobar]]')).toEqual(undefined);
    expect(matchArrayGroupName('[...foobar]')).toEqual(undefined);
    expect(matchArrayGroupName('[foobar]')).toEqual(undefined);
    expect(matchArrayGroupName('foobar')).toEqual(undefined);
    expect(matchArrayGroupName('leading/foobar')).toEqual(undefined);
    expect(matchArrayGroupName('leading/foobar/trailing')).toEqual(undefined);
  });
  it(`should not match routes with a single group`, () => {
    expect(matchArrayGroupName('(foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('((foobar))')).toEqual(undefined);
    expect(matchArrayGroupName('(...foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('leading/(foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('leading/((foobar))')).toEqual(undefined);
    expect(matchArrayGroupName('leading/(...foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('leading/(foobar)/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('leading/((foobar))/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('leading/(...foobar)/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/foobar')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/(foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/((foobar))')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/(...foobar)')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/foobar/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/(foobar)/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/((foobar))/trailing')).toEqual(undefined);
    expect(matchArrayGroupName('(leading)/(...foobar)/trailing')).toEqual(undefined);
  });
  it(`should match routes with array group syntax`, () => {
    expect(matchArrayGroupName('(foo,bar)')).toEqual('foo,bar');
    expect(matchArrayGroupName('leading/(foo,bar)')).toEqual('foo,bar');
    expect(matchArrayGroupName('leading/(foo,bar)/trailing)')).toEqual('foo,bar');
    expect(matchArrayGroupName('leading/((foo),(bar))/trailing)')).toEqual('(foo),(bar)');
    expect(matchArrayGroupName('leading/(foo,bar)/(fruit,apple)')).toEqual('foo,bar');
    expect(matchArrayGroupName('(leading)/(foo,bar)')).toEqual('foo,bar');
    expect(matchArrayGroupName('(leading)/(foo,bar)/trailing)')).toEqual('foo,bar');
    expect(matchArrayGroupName('(leading)/((foo),(bar))/trailing)')).toEqual('(foo),(bar)');
  });
  it(`should only match the first group with array group syntax`, () => {
    expect(matchArrayGroupName('(leading)/(foo,bar)/(fruit,apple)')).toEqual('foo,bar');
    expect(matchArrayGroupName('(leading)/((foo),bar)/(fruit,apple)')).toEqual('(foo),bar');
    expect(matchArrayGroupName('(leading)/(foo,bar)/((fruit),apple)')).toEqual('foo,bar');
  });
});
