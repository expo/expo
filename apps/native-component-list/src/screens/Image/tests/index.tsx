import AppearanceTests from './appearance';
import BorderTests from './borders';
import ShadowsTests from './shadows';
import SourcesTests from './sources';

const tests = {
  name: 'Image',
  tests: [AppearanceTests, BorderTests, ShadowsTests, SourcesTests],
};

export default tests;
