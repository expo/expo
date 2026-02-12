import { requireNativeModule } from 'expo';

import type { ExpoBrownfieldStateModuleSpec } from './types';

export default requireNativeModule<ExpoBrownfieldStateModuleSpec>('ExpoBrownfieldStateModule');
