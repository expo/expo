import { createErrorHandler } from './DevLauncherErrorManager';
const globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler(createErrorHandler(globalHandler));
//# sourceMappingURL=setUpErrorHandler.fx.js.map