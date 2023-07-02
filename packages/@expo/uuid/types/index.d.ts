import { v4 } from './interfaces';
import { v5 } from './v5';

interface UuidStatic {
  v4: v4;
  v5: typeof v5;
}

declare const uuid: UuidStatic;
export = uuid;
