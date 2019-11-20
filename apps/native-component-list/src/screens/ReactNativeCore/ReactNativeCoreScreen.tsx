// see https://github.com/Microsoft/TypeScript/issues/8328#issuecomment-219583152
import * as ios from './ReactNativeCoreScreen.ios';
import * as android from './ReactNativeCoreScreen.android';
import * as web from './ReactNativeCoreScreen.web';

declare var _test: typeof ios;
declare var _android: typeof android;
declare var _web: typeof web;

export * from './ReactNativeCoreScreen.ios';
import { default as d } from './ReactNativeCoreScreen.ios';
export default d;
