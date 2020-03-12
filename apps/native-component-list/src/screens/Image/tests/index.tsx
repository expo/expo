import { ImageTestGroup } from '../types';
import AndroidTests from './android';
import AppearanceTests from './appearance';
import EventTests from './events';
import IOSTests from './ios';
import SourceTests from './source';

const tests: ImageTestGroup = {
  name: 'Image',
  tests: [AppearanceTests, SourceTests, EventTests, IOSTests, AndroidTests],
};

export default tests;
