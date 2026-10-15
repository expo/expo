'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { linkageDeclaration, xcconfigLinkerFlags, readPodspecs } = require('../podspec');

const { spec } = require('./helpers');

describe('linkageDeclaration', () => {
  it.each([
    ["  s.frameworks = 'Photos', 'PhotosUI'"],
    ['  s.frameworks = ["AudioToolbox"]'],
    ["  s.ios.frameworks = 'AVFoundation'"],
    ["  s.weak_frameworks = 'Speech'"],
    ["  s.libraries = 'sqlite3'"],
    ["  spec.frameworks = 'Photos'"],
  ])('reports %s', (line) => {
    expect(linkageDeclaration(spec(line))).toEqual({ number: 2, text: line.trim() });
  });

  it('reports a declaration inside a heredoc body, rather than missing a real one', () => {
    expect(
      linkageDeclaration(spec('  s.description = <<~DESC', "    s.libraries = 'sqlite3'", '  DESC'))
    ).toEqual({ number: 3, text: "s.libraries = 'sqlite3'" });
  });

  it('reports a declaration a comment trails, and none for a commented-out line', () => {
    expect(linkageDeclaration(spec("  s.frameworks = 'Photos' # keep?"))).toEqual({
      number: 2,
      text: "s.frameworks = 'Photos'",
    });
    expect(linkageDeclaration(spec("  # s.frameworks = 'Photos'"))).toBeNull();
  });

  it('ignores declarations that are neither iOS linkage nor linkage at all', () => {
    expect(
      linkageDeclaration(
        spec(
          '  s.vendored_frameworks = "#{s.name}.xcframework"',
          "  s.osx.frameworks = 'AppKit'",
          "  s.source_files = 'ios/**/*.swift'"
        )
      )
    ).toBeNull();
  });
});

describe('readPodspecs', () => {
  const write = (dir, files) => {
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
    return dir;
  };
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'expo-spm-podspecs-'));

  it("reads the pod's own podspec, ignoring companions that sort before it", () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'AAACompanion.podspec': spec(
        "  s.frameworks = 'Vision'",
        "  s.platforms = { :ios => '18.0' }"
      ),
      'ExpoCamera.podspec': spec("  s.platforms = { :ios => '16.4' }"),
    });

    expect(readPodspecs('ExpoCamera', [dir])).toEqual({ linkage: null, linkerFlags: null });
  });

  it('falls back to every podspec in the directories when none carries the pod name', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'Legacy.podspec': spec("  s.summary = 'Carries nothing the reader looks for'"),
      'Other.podspec': spec("  s.frameworks = 'Photos'"),
    });

    expect(readPodspecs('ExpoCamera', [dir]).linkage).toEqual({
      file: path.join(dir, 'Other.podspec'),
      line: 2,
      snippet: "s.frameworks = 'Photos'",
    });
  });

  it('reports the linkage declaration with the file it came from', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'ExpoMediaLibrary.podspec': spec(
        "  s.platforms = { :ios => '16.4' }",
        "  s.frameworks = 'Photos', 'PhotosUI'"
      ),
    });

    expect(readPodspecs('ExpoMediaLibrary', [dir]).linkage).toEqual({
      file: path.join(dir, 'ExpoMediaLibrary.podspec'),
      line: 3,
      snippet: "s.frameworks = 'Photos', 'PhotosUI'",
    });
  });

  it('declares nothing for a module with no podspec at all', () => {
    expect(readPodspecs('ExpoThing', ['/nonexistent'])).toEqual({
      linkage: null,
      linkerFlags: null,
    });
  });

  it('reports linker flags from the second podspec when the first carries none', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'Legacy.podspec': spec("  s.summary = 'Carries nothing the reader looks for'"),
      'Other.podspec': spec(
        '  s.pod_target_xcconfig = {',
        "    'OTHER_LDFLAGS' => '$(inherited) -lc++'",
        '  }'
      ),
    });

    expect(readPodspecs('ExpoCamera', [dir]).linkerFlags).toEqual({
      file: path.join(dir, 'Other.podspec'),
      line: 3,
      snippet: "'OTHER_LDFLAGS' => '$(inherited) -lc++'",
    });
  });

  it('reports linker flags an xcconfig sets, with the file they came from', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'ExpoScreenCapture.podspec': spec(
        '  s.pod_target_xcconfig = {',
        "    'OTHER_LDFLAGS' => '$(inherited) -lc++'",
        '  }'
      ),
    });

    expect(readPodspecs('ExpoScreenCapture', [dir]).linkerFlags).toEqual({
      file: path.join(dir, 'ExpoScreenCapture.podspec'),
      line: 3,
      snippet: "'OTHER_LDFLAGS' => '$(inherited) -lc++'",
    });
  });
});

describe('xcconfigLinkerFlags', () => {
  it.each([
    ["      'OTHER_LDFLAGS' => '$(inherited) -lc++'"],
    ['      "OTHER_LDFLAGS" => "$(inherited) -framework Photos"'],
  ])('reports %s', (line) => {
    expect(xcconfigLinkerFlags(spec('  s.pod_target_xcconfig = {', line, '  }'))).toEqual({
      number: 3,
      text: line.trim(),
    });
  });

  it('ignores OTHER_LDFLAGS that links nothing, and other build settings', () => {
    expect(
      xcconfigLinkerFlags(
        spec(
          '  s.pod_target_xcconfig = {',
          "    'OTHER_LDFLAGS' => '$(inherited)',",
          "    'DEFINES_MODULE' => 'YES',",
          "    'OTHER_CFLAGS' => '-lfoo'",
          '  }'
        )
      )
    ).toBeNull();
  });
});

describe('test_spec blocks', () => {
  it('reports nothing from a test_spec, another platform or a vendored framework', () => {
    expect(
      linkageDeclaration(
        spec(
          '  s.vendored_frameworks = "#{s.name}.xcframework"',
          "  s.osx.frameworks = 'AppKit'",
          "  s.test_spec 'Tests' do |test_spec|",
          "    test_spec.frameworks = 'XCTest'",
          "    test_spec.libraries = 'stdc++'",
          '  end'
        )
      )
    ).toBeNull();
  });

  it('skips a test_spec block by its `do … end` depth, however it is indented', () => {
    expect(
      linkageDeclaration(
        spec(
          "s.test_spec 'Tests' do |test_spec|",
          "test_spec.frameworks = 'XCTest'",
          "test_spec.source_files = 'Tests/**/*'",
          "if ENV['CI']",
          "test_spec.libraries = 'stdc++'",
          'end',
          'end',
          "  s.frameworks = 'Photos'"
        )
      )
    ).toEqual({ number: 9, text: "s.frameworks = 'Photos'" });
  });

  it('reports no xcconfig flags a test_spec sets', () => {
    expect(
      xcconfigLinkerFlags(
        spec(
          "  s.test_spec 'Tests' do |test_spec|",
          '    test_spec.pod_target_xcconfig = {',
          "      'OTHER_LDFLAGS' => '$(inherited) -lc++'",
          '    }',
          '  end'
        )
      )
    ).toBeNull();
  });

  it.each([
    ['a linker flag', '    ts.pod_target_xcconfig = { "OTHER_LDFLAGS" => "-Wl,--end-group" }'],
    ['prose', '    ts.summary = "start to end here"'],
  ])('closes the block where it really ends, past an `end` inside %s', (_name, line) => {
    expect(
      linkageDeclaration(
        spec("  s.test_spec 'Tests' do |ts|", line, "    ts.frameworks = 'XCTest'", '  end')
      )
    ).toBeNull();
  });

  it('closes the block where it really ends, past a `do` inside a string', () => {
    expect(
      linkageDeclaration(
        spec(
          "  s.test_spec 'Tests' do |ts|",
          '    ts.summary = "things to do in here"',
          "    ts.frameworks = 'XCTest'",
          '  end',
          "  s.frameworks = 'Photos'"
        )
      )
    ).toEqual({ number: 6, text: "s.frameworks = 'Photos'" });
  });
});

describe('a `#` inside a quoted string', () => {
  it('quotes an interpolated linkage declaration intact', () => {
    expect(linkageDeclaration(spec('  s.frameworks = "#{prefix}Kit"'))).toEqual({
      number: 2,
      text: 's.frameworks = "#{prefix}Kit"',
    });
  });

  it('strips a trailing comment while keeping the interpolation before it', () => {
    expect(linkageDeclaration(spec('  s.frameworks = "#{prefix}Kit" # keep?'))).toEqual({
      number: 2,
      text: 's.frameworks = "#{prefix}Kit"',
    });
  });

  it('strips a trailing comment without truncating a string holding astral characters', () => {
    expect(linkageDeclaration(spec('  s.frameworks = "🎉🎉🎉PhotosKit" # note'))).toEqual({
      number: 2,
      text: 's.frameworks = "🎉🎉🎉PhotosKit"',
    });
  });

  it('still sees linker flags an interpolated xcconfig value sets', () => {
    const line = '    \'OTHER_LDFLAGS\' => "#{inherited} -lc++"';
    expect(xcconfigLinkerFlags(spec('  s.pod_target_xcconfig = {', line, '  }'))).toEqual({
      number: 3,
      text: line.trim(),
    });
  });
});
