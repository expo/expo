#import <EXDevLauncher/EXDevLauncherReactNativeFactory.h>
#import <EXDevMenu/DevClientNoOpLoadingView.h>

@implementation EXDevLauncherReactNativeFactory

- (Class)getModuleClassFromName:(const char *)name {
  // Overrides DevLoadingView ("Connect to Metro to develop JavaScript") as no-op when loading dev-launcher bundle
  if (strcmp(name, "DevLoadingView") == 0) {
    return [DevClientNoOpLoadingView class];
  }
  return [super getModuleClassFromName:name];
}

@end
