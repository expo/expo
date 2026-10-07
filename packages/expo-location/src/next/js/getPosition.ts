import { NativeLocationModuleNext } from '../native';
import type { GetPositionOptions, Position } from '../types';

export async function getPosition(options?: GetPositionOptions): Promise<Position | null> {
  return NativeLocationModuleNext.getPosition(options);
}
