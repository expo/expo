import { getNativeLocationModuleNext } from '../native';
import type { GetPositionOptions, Position } from '../types';

export async function getPosition(options?: GetPositionOptions): Promise<Position | null> {
  return getNativeLocationModuleNext().getPosition(options);
}
