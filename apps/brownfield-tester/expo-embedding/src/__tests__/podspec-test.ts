import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readPodspec } from '../podspec';

describe('Parsing podspecs without Ruby', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'embedding-podspec-'));
    mkdirSync(join(root, 'ios'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  function parse(body: string, preamble = '') {
    const path = join(root, 'ios/Example.podspec');
    writeFileSync(path, `${preamble}\nPod::Spec.new do |s|\n${body}\nend\n`);
    return readPodspec(root, path);
  }
  it('should read literal attributes, hashes, arrays and platform settings', () => {
    expect(
      parse(
        `s.name = 'Example'\ns.source_files = '**/*.{swift,m}', 'include/*.h'\ns.ios.frameworks = ['UIKit']\ns.platforms = { :ios => '16.4' }\ns.dependency 'ExpoModulesCore'`
      )
    ).toEqual({
      name: 'Example',
      source_files: ['**/*.{swift,m}', 'include/*.h'],
      ios: { frameworks: ['UIKit'] },
      platforms: { ios: '16.4' },
      dependencies: { ExpoModulesCore: [] },
    });
  });
  it('should resolve package metadata through the common JSON and File expressions', () => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'example', version: '1.2.3' })
    );
    expect(
      parse(
        "s.version = package['version']",
        "require 'json'\npackage = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))"
      )
    ).toEqual({ version: '1.2.3' });
  });
  it('should skip test specifications without executing their Ruby body', () => {
    expect(
      parse(
        "s.name = 'Example'\ns.test_spec 'Tests' do |t|\n if ENV['RUN_TESTS']\n  raise 'never execute'\n end\nend"
      )
    ).toEqual({ name: 'Example' });
  });
  it('should preserve hash-like text, escaped quotes and comments inside strings', () => {
    expect(parse(String.raw`s.summary = 'a # comment and \'quote\'' # real comment`)).toEqual({
      summary: "a # comment and 'quote'",
    });
  });
  it.each([
    "s.source_files = 'a.swift' if ENV['FLAG']",
    "if true\ns.source_files = 'a.swift'\nend",
    's.source_files = glob_sources()',
    's.source_files = "#{ENV[\'SOURCES\']}"',
    "s.subspec 'Extra' do |t|\nt.source_files = '*.m'\nend",
    "system('touch /tmp/never-run')",
  ])('should reject unsupported build behavior with a source location: %s', (body) => {
    expect(() => parse(body)).toThrow(/Example\.podspec:\d+:.*Unsupported/);
  });
  it('should refuse file reads outside package.json in the installed package', () => {
    expect(() => parse('s.name = value', "value = File.read('/etc/passwd')")).toThrow(
      'package.json'
    );
  });
  it('should reject incomplete input instead of returning a partial specification', () => {
    expect(() => parse("s.frameworks = ['UIKit'")).toThrow('Example.podspec:');
  });
});
