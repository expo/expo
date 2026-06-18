import path from 'path';

import { fixturePath } from './fixtures';
import { PbxFile, project, XcodeProjectShim } from '../index';

describe('substrate', () => {
  it('resolves filepath without reading the file', () => {
    const p = project('ios/HelloWorld.xcodeproj/project.pbxproj');
    expect(p).toBeInstanceOf(XcodeProjectShim);
    expect(p.filepath).toBe(path.resolve('ios/HelloWorld.xcodeproj/project.pbxproj'));
  });

  it('parses and serializes a real project', () => {
    const p = project(fixturePath('bareMinimum'));
    expect(p.parseSync()).toBe(p);
    const output = p.writeSync();
    expect(output).toContain('// !$*UTF8*$!');
    expect(output).toContain('PBXProject');
  });

  it('throws a helpful error when serializing before parsing', () => {
    expect(() => project(fixturePath('bareMinimum')).writeSync()).toThrow(/parseSync/);
  });
});

describe('stubbed surface', () => {
  it('throws "not implemented yet" for unimplemented methods', () => {
    const p = project(fixturePath('bareMinimum')).parseSync();
    expect(() => p.addBuildPhase()).toThrow(/not implemented yet/);
    expect(() => p.addTarget()).toThrow(/not implemented yet/);
    expect(() => p.pbxProjectSection()).toThrow(/not implemented yet/);
  });

  it('throws "not implemented yet" when constructing a pbxFile', () => {
    expect(() => new PbxFile('Foo.swift')).toThrow(/not implemented yet/);
  });
});
