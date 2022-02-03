import { ErrorUtils } from 'react-native';

import { createErrorHandler } from './DevLauncherErrorManager';

const globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
