// see https://github.com/Microsoft/TypeScript/issues/8328#issuecomment-219583152
import * as android from './AudioModeSelector.android';
import * as ios from './AudioModeSelector.ios';
import { default as d } from './AudioModeSelector.ios';
import * as web from './AudioModeSelector.web';
// tslint:disable-next-line no-duplicate-imports

declare var _test: typeof ios;
declare var _android: typeof android;
declare var _web: typeof web;

// eslint-disable-next-line
export * from './AudioModeSelector.ios';
export default d;
