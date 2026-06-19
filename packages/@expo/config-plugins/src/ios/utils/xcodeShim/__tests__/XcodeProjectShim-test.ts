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
    expect(() => p.addToBuildSettings()).toThrow(/not implemented yet/);
    expect(() => p.removePbxGroup()).toThrow(/not implemented yet/);
    expect(() => p.pbxItemByComment()).toThrow(/not implemented yet/);
  });
});

describe('read re-quoting (legacy-faithful)', () => {
  it('quotes values pbxproj would quote on read, leaves safe ones bare', () => {
    const p = project(fixturePath('bareMinimum')).parseSync();
    const target: any = Object.values(p.pbxNativeTargetSection()).find(
      (t: any) => t && t.isa === 'PBXNativeTarget'
    );
    // Hyphen isn't a safe pbxproj identifier char, so productType reads quoted —
    // matching legacy (and plugins that strict-compare the quoted form).
    expect(target.productType).toBe('"com.apple.product-type.application"');
    // A safe identifier reads bare.
    expect(target.name).toBe('HelloWorld');
  });
});

describe('pbxFile', () => {
  it('derives file metadata from the path', () => {
    const file = new PbxFile('HelloWorld/Foo.swift');
    expect(file.basename).toBe('Foo.swift');
    expect(file.lastKnownFileType).toBe('sourcecode.swift');
    expect(file.group).toBe('Sources');
    expect(file.sourceTree).toBe('"<group>"');
  });
});
