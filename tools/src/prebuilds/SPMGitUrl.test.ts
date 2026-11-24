import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { derivePackageNameFromUrl } from './SPMGitUrl';

describe('derivePackageNameFromUrl', () => {
  it('strips .git suffix and extracts last path segment', () => {
    assert.equal(
      derivePackageNameFromUrl('https://github.com/SDWebImage/SDWebImageWebPCoder.git'),
      'SDWebImageWebPCoder'
    );
  });

  it('works without .git suffix', () => {
    assert.equal(derivePackageNameFromUrl('https://github.com/airbnb/lottie-spm'), 'lottie-spm');
  });

  it('handles scoped / deeply nested URLs', () => {
    assert.equal(
      derivePackageNameFromUrl('https://github.com/nicklockwood/libavif-Xcode.git'),
      'libavif-Xcode'
    );
  });
});
