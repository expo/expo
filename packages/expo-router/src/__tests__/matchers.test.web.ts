import {
  matchDynamicName,
  matchDeepDynamicRouteName,
  getNameFromFilePath,
  matchGroupName,
  stripGroupSegmentsFromPath,
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
