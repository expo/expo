import { expectAssignable } from 'tsd-lite';

import type { Href } from './fixtures/largeApp';

declare const a: Href;
declare const b: Href;
declare const c: boolean;

test('combines two Href values in an app with 150 screens', () => {
  expectAssignable<Href>(c ? a : b);
});
