// Jest transformer for image assets. Jest's resolver runs first, so a broken
// relative path fails with "Cannot find module ..." before this transformer is
// invoked — that's the regression guard against bugs like #45170. When the
// file exists, return a numeric stub like Metro does.
module.exports = {
  process() {
    return { code: 'module.exports = 1;' };
  },
};
