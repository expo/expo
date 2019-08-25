let originalErrorHandler;
if (global.ErrorUtils && !originalErrorHandler) {
  originalErrorHandler = global.ErrorUtils.getGlobalHandler();

  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Prevent optionalRequire from failing
    if (
      isFatal &&
      (error.message.includes('Native module cannot be null') ||
        error.message.includes(
          `from NativeViewManagerAdapter isn't exported by @unimodules/react-native-adapter. Views of this type may not render correctly. Exported view managers: `
        ))
    ) {
      console.log('Caught require error');
    } else {
      if (global.expoErrorDelegate) {
        global.expoErrorDelegate.throw(error, isFatal);
      }
      originalErrorHandler(error, isFatal);
    }
  });
}
