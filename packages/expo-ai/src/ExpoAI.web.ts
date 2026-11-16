import type { NativeLanguageModels } from './NativeLanguageModels.types';
import { BrowserLanguageModels } from './web/BrowserLanguageModels';

const module: NativeLanguageModels = new BrowserLanguageModels();

export default module;
