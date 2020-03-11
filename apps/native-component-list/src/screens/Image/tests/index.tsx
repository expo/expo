import { ImageTestGroup } from '../types';
import AndroidTests from './android';
import AppearanceTests from './appearance';
import EventTests from './events';
import IOSTests from './ios';

const tests: ImageTestGroup = {
  name: 'Image',
  tests: [AppearanceTests, EventTests, IOSTests, AndroidTests],
};

export default tests;
