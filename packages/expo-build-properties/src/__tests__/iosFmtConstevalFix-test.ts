import {
  addFmtConstevalFixToPodfile,
  removeFmtConstevalFixFromPodfile,
} from '../iosFmtConstevalFix';

const SAMPLE_PODFILE = `target 'HelloWorld' do
  use_expo_modules!

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )
  end
end
`;

describe('iosFmtConstevalFix', () => {
  it('addFmtConstevalFixToPodfile inserts generated block after react_native_post_install', () => {
    const { contents, didMerge } = addFmtConstevalFixToPodfile(SAMPLE_PODFILE);
    expect(didMerge).toBe(true);
    expect(contents).toContain("podfile_properties['ios.buildReactNativeFromSource'] == 'true'");
    expect(contents).toContain('fmt_base = File.join(installer.sandbox.root.to_s');
    expect(contents).toContain('@generated begin expo-fmt-use-consteval-fix');
  });

  it('removeFmtConstevalFixFromPodfile removes the generated block', () => {
    const { contents: added } = addFmtConstevalFixToPodfile(SAMPLE_PODFILE);
    const { contents: removed, didClear } = removeFmtConstevalFixFromPodfile(added);
    expect(didClear).toBe(true);
    expect(removed).not.toContain('expo-fmt-use-consteval-fix');
    expect(removed.replace(/\s+/g, ' ')).toContain(
      SAMPLE_PODFILE.replace(/\s+/g, ' ').trim().slice(0, 80)
    );
  });

  it('addFmtConstevalFixToPodfile returns unchanged when react_native_post_install is missing', () => {
    const src = 'target "X" do\nend\n';
    const { contents, didMerge } = addFmtConstevalFixToPodfile(src);
    expect(didMerge).toBe(false);
    expect(contents).toBe(src);
  });
});
