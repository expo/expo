'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  linkageDeclaration,
  xcconfigLinkerFlags,
  readIosFloor,
  readPodspecs,
  PodspecSyntaxError,
} = require('../podspec');

const spec = (...body) => ['Pod::Spec.new do |s|', ...body, 'end', ''].join('\n');

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

describe('readIosFloor', () => {
  const FILE = '/m/ios/ExpoThing.podspec';
  const read = (...body) => readIosFloor(spec(...body), FILE);
  const rejected = (...body) => {
    let error = null;
    try {
      read(...body);
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(PodspecSyntaxError);
    expect(error.file).toBe(FILE);
    return error;
  };

  it('reads the platforms hash, on one line or several', () => {
    expect(read("  s.platforms = { :ios => '16.4', :osx => '13.4' }")).toBe('16.4');
    expect(read('  s.platforms      = {', "    :ios => '16.4',", "    :osx => '13.4'", '  }')).toBe(
      '16.4'
    );
    expect(read('  s.platforms = { :ios => "16.4" } # the floor')).toBe('16.4');
  });

  it('reads a single-line ios deployment target', () => {
    expect(read("  s.ios.deployment_target = '16.4'")).toBe('16.4');
  });

  it('takes the higher of the two forms, whichever comes first', () => {
    expect(read("  s.platforms = { :ios => '15.1' }", "  s.ios.deployment_target = '16.4'")).toBe(
      '16.4'
    );
    expect(read("  s.ios.deployment_target = '15.1'", "  s.platforms = { :ios => '16.4' }")).toBe(
      '16.4'
    );
  });

  it('reads a CRLF podspec exactly like an LF one', () => {
    const text = spec('  s.platforms = {', "    :ios => '16.4'", '  }');
    expect(readIosFloor(text.replace(/\n/g, '\r\n'), FILE)).toBe(readIosFloor(text, FILE));
    expect(readIosFloor(text.replace(/\n/g, '\r\n'), FILE)).toBe('16.4');
  });

  it('returns no floor when the podspec declares none, or names other platforms only', () => {
    expect(read("  s.source_files = 'ios/**/*.swift'")).toBeNull();
    expect(read("  s.platforms = { :osx => '13.4' }")).toBeNull();
    expect(read("  s.osx.deployment_target = '13.4'")).toBeNull();
  });

  it.each([
    ['a merged hash', "  s.platforms = { :ios => '16.4' }.merge(EXTRA)"],
    ['a frozen hash', "  s.platforms = { :ios => '16.4' }.freeze"],
    ['a hash built from a variable', '  s.platforms = PLATFORMS'],
    ['an interpolated version', '  s.platforms = { :ios => "#{MIN_IOS}" }'],
    ['a version held in a variable', '  s.platforms = { :ios => min_ios }'],
    ['a non-version value', "  s.platforms = { :ios => 'sixteen' }"],
    ['a hash that never closes', '  s.platforms = { :ios =>'],
    ['an interpolated deployment target', '  s.ios.deployment_target = "#{MIN_IOS}"'],
    ['a computed deployment target', '  s.ios.deployment_target = min_ios'],
  ])('refuses %s', (_name, line) => {
    expect(rejected(line).line).toBe(2);
  });

  it('refuses two `:ios` keys in one hash', () => {
    expect(rejected("  s.platforms = { :ios => '15.1', :ios => '16.4' }").line).toBe(2);
  });

  it('refuses a second platforms statement, whose winner depends on evaluation order', () => {
    expect(
      rejected("  s.platforms = { :ios => '15.1' }", "  s.platforms = { :ios => '16.4' }").line
    ).toBe(3);
  });

  it('names the offending line in the error', () => {
    const error = rejected("  s.platforms = { :ios => '16.4' }.freeze");
    expect(error.snippet).toBe("s.platforms = { :ios => '16.4' }.freeze");
    expect(error.message).toContain(`${FILE}:2`);
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

    expect(readPodspecs('ExpoCamera', [dir])).toEqual({
      linkage: null,
      linkerFlags: null,
      iosDeploymentTarget: '16.4',
    });
  });

  it('falls back to every podspec in the directories when none carries the pod name', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'Legacy.podspec': spec("  s.platforms = { :ios => '16.4' }"),
      'Other.podspec': spec("  s.ios.deployment_target = '17.0'"),
    });

    expect(readPodspecs('ExpoCamera', [dir]).iosDeploymentTarget).toBe('17.0');
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

  it('reports linkage without reading the floor, so one fix at a time is enough', () => {
    const dir = write(path.join(tmp(), 'ios'), {
      'ExpoThing.podspec': spec('  s.platforms = PLATFORMS', "  s.frameworks = 'Photos'"),
    });

    expect(readPodspecs('ExpoThing', [dir]).linkage).not.toBeNull();
  });

  it('declares nothing for a module with no podspec at all', () => {
    expect(readPodspecs('ExpoThing', ['/nonexistent'])).toEqual({
      linkage: null,
      linkerFlags: null,
      iosDeploymentTarget: null,
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

  // The shape of packages/expo-dev-menu: a literal floor, and a test_spec that sets
  // its own platforms. The second `platforms` is the test spec's, not a competitor.
  it("reads the module's floor past a test_spec that sets its own platforms", () => {
    expect(
      readIosFloor(
        spec(
          "  s.platforms = { :ios => '16.4', :tvos => '16.4' }",
          "  s.test_spec 'Tests' do |test_spec|",
          '    test_spec.platforms = {',
          "      :ios => '16.4'",
          '    }',
          '  end'
        ),
        '/m/ios/ExpoDevMenu.podspec'
      )
    ).toBe('16.4');
  });
});

describe('a `#` inside a quoted string', () => {
  const FILE = '/m/ios/ExpoThing.podspec';

  it('refuses an interpolated floor as interpolation, quoting the line intact', () => {
    const line = '  s.platforms = { :ios => "#{MIN_IOS}" }';
    let error = null;
    try {
      readIosFloor(spec(line), FILE);
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(PodspecSyntaxError);
    expect(error.snippet).toBe(line.trim());
    expect(error.reason).toMatch(/interpolation/);
    expect(error.reason).not.toMatch(/never closed/);
  });

  it('quotes an interpolated linkage declaration intact', () => {
    expect(linkageDeclaration(spec('  s.frameworks = "#{prefix}Kit"'))).toEqual({
      number: 2,
      text: 's.frameworks = "#{prefix}Kit"',
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
