import { requireNativeModule } from 'expo';
import type { ExpoBrownfieldModuleSpec } from './types';

export default requireNativeModule<ExpoBrownfieldModuleSpec>(
  'ExpoBrownfieldModule',
);
