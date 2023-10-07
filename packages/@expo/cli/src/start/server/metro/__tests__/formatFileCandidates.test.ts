import { formatFileCandidates } from '../formatFileCandidates';

describe(formatFileCandidates, () => {
  it(`formats source`, () => {
    expect(
      formatFileCandidates(
        {
          candidateExts: ['.ios.js', '.native.js', '.js', '.ts'],
          filePathPrefix: 'packages/expo-status-bar/src',
          type: 'sourceFile',
        },
        true
      )
    ).toMatchInlineSnapshot(`"packages/expo-status-bar/src(/index)?(.ios|.native)?.(js|ts)"`);
  });
  it(`formats basic`, () => {
    expect(
      formatFileCandidates(
        {
          candidateExts: ['.js'],
          filePathPrefix: 'about',
          type: 'sourceFile',
        },
        true
      )
    ).toMatchInlineSnapshot(`"about(/index)?.(js)"`);
  });
  it(`formats source without index`, () => {
    expect(
      formatFileCandidates({
        candidateExts: ['.ios.js', '.native.js', '.js', '.ts'],
        filePathPrefix: 'packages/expo-status-bar/src',
        type: 'sourceFile',
      })
    ).toMatchInlineSnapshot(`"packages/expo-status-bar/src(.ios|.native)?.(js|ts)"`);
  });
  it(`formats asset`, () => {
    expect(
      formatFileCandidates(
        {
          name: 'img.png',
          type: 'asset',
        },
        true
      )
    ).toMatchInlineSnapshot(`"img.png"`);
  });
});
