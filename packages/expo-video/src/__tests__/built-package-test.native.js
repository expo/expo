const fs = require('fs');
const path = require('path');

// Smoke test for the path a consuming app takes: it resolves the compiled
// `build/` output, where stack frames are source-mapped to TypeScript paths
// that are never emitted (e.g. `build/ExpoVideo.ts`). The jest-expo mock
// lookup then only works because the call-site file name (`src/ExpoVideo.ts`)
// contains the native module name. This test fails if that file is renamed.
// The source-importing tests in `VideoPlayer-test.native.ts` cannot catch
// that, because the source file exists on disk.
//
// IMPORTANT: this test file's name must NOT contain 'ExpoVideo'. The lookup
// matches the module name against every stack-frame path, so a matching test
// file name would resolve the mock even after a rename and hide the regression.
const buildDir = path.join(__dirname, '..', '..', 'build');
const describeBuild = fs.existsSync(path.join(buildDir, 'index.js')) ? describe : describe.skip;

describeBuild('expo-video built package under the jest-expo preset', () => {
  it('resolves the ExpoVideo mock from a source-mapped call site', () => {
    // Requiring the compiled VideoPlayer module runs the prototype patch that
    // crashed in expo/expo#37842 when the mock was not found.
    const { createVideoPlayer } = require('../../build/VideoPlayer');
    const NativeVideoModule = require('../../build/ExpoVideo').default;

    expect(typeof NativeVideoModule.VideoPlayer).toBe('function');

    const player = createVideoPlayer('https://example.com/video.mp4');
    player.replace('https://example.com/other.mp4', true);
    player.play();
    expect(player.playing).toBe(true);
  });
});
