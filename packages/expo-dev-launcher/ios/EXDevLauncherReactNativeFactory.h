 #import <React-RCTAppDelegate/RCTReactNativeFactory.h>

@interface RCTReactNativeFactory (GetModuleClass)

- (Class)getModuleClassFromName:(const char *)name;

@end

@interface EXDevLauncherReactNativeFactory : RCTReactNativeFactory

@end
