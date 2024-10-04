import AppearanceTests from './appearance';
import BorderTests from './borders';
import ShadowsTests from './shadows';
import SourcesTests from './sources';
import { ImageTestGroup } from '../types';

const tests: ImageTestGroup = {
  name: 'Image',
  tests: [AppearanceTests, BorderTests, ShadowsTests, SourcesTests],
};

export default tests;
