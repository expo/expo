#import <EXDevMenu/DevClientReactNativeFactoryDelegate.h>
#import <EXDevMenu/DevClientNoOpLoadingView.h>

@implementation DevClientReactNativeFactoryDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  // Overrides DevLoadingView as no-op when loading dev-launcher bundle
  if (strcmp(name, "DevLoadingView") == 0) {
    return [DevClientNoOpLoadingView class];
  }
  return [super getModuleClassFromName:name];
}

// sourceURLForBridge is here just to silence a warning
- (nonnull NSURL *)sourceURLForBridge:(nonnull RCTBridge *)bridge {
  return [super sourceURLForBridge:bridge];
}

@end
