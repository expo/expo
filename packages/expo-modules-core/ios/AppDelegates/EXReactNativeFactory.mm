#import "EXReactNativeFactory.h"

@interface EXReactNativeFactory ()

-(RCTRootViewFactory*) internalCreateRCTRootViewFactory;

@end

@implementation EXReactNativeFactory

- (RCTRootViewFactory *) createRCTRootViewFactory {
  return [self internalCreateRCTRootViewFactory];
}

- (RCTRootViewFactory *) internalCreateRCTRootViewFactory {
  RCTFatal(RCTErrorWithMessage(@"EXReactNativeFactory - internalCreateRCTRootViewFactory should be overridden and implemented!"));
  return nil;
}

@end
