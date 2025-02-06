#import "EXReactNativeFactory.h"

@interface EXReactNativeFactory ()

-(RCTRootViewFactory*) internalCreateRCTRootViewFactory;

@end

@implementation EXReactNativeFactory

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate {
  self = [super initWithDelegate:delegate];
  if (self != nil) {
    // Initialization?
  }
  return self;
}

- (RCTRootViewFactory *) createRCTRootViewFactory {
  return [self internalCreateRCTRootViewFactory];
}

- (RCTRootViewFactory *) internalCreateRCTRootViewFactory {
  RCTFatal(RCTErrorWithMessage(@"EXReactNativeFactory - internalCreateRCTRootViewFactory should be overridden and implemented!"));
  return nil;
}

@end
