#import "EXAppRootViewFactory.h"

@implementation EXAppRootViewFactory {
  RCTRootViewFactoryConfiguration *_configuration;
}

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate {
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    _configuration = configuration;
  }
  return self;
}

- (void)loadSourceForHost:(RCTHost *)host onComplete:(RCTSourceLoadBlock)loadCallback {
  if (self->_configuration.loadSourceForHost) {
    self->_configuration.loadSourceForHost(host, loadCallback);
  }
}


@end
