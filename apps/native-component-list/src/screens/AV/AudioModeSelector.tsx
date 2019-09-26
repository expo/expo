// see https://github.com/Microsoft/TypeScript/issues/8328#issuecomment-219583152
import * as ios from './AudioModeSelector.ios';
import * as android from './AudioModeSelector.android';
import * as web from './AudioModeSelector.web';

declare var _test: typeof ios;
declare var _android: typeof android;
declare var _web: typeof web;

export * from './AudioModeSelector.ios';
// tslint:disable-next-line no-duplicate-imports
import { default as d } from './AudioModeSelector.ios';
export default d;
