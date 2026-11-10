import { a } from './imports-helper';
import { b } from './imports-helper';
import { c } from './imports-module';
import platform from './imports-platform';
import { missing } from './imports-helper';

export default a + b + c + platform + missing;
