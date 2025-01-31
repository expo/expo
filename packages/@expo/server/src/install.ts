// NOTE(@kitten): Both imports here have side-effects
// The latter declares global types. Do not remove.
// Check `./build/install.d.ts` for this import!
import 'source-map-support/register';
import { installGlobals } from './environment';

installGlobals();
