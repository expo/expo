#import "EXReactNativeFactory.h"

@interface EXReactNativeFactory ()

@property (nonatomic, copy) RCTRootViewFactory * (^createRootViewFactory)(void);

@end

@implementation EXReactNativeFactory

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate
           createRootViewFactory:(RCTRootViewFactory * (^)(void))createRootViewFactory {
  // Make sure we save the factory before calling super - super calls createRCTRootViewFactory
  _createRootViewFactory = [createRootViewFactory copy];
  self = [super initWithDelegate:delegate];
  return self;
}

- (RCTRootViewFactory *)createRCTRootViewFactory {
  if (self.createRootViewFactory == nil) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ExpoReactNativeFactory: createRootViewFactory is nil. Cannot create RCTRootViewFactory."
                                 userInfo:nil];
  }
  return self.createRootViewFactory();
}

@end
