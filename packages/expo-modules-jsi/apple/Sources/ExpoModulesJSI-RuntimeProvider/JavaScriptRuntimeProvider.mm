#import "JavaScriptRuntimeProvider.h"

@implementation JavaScriptRuntimeProvider {
  facebook::jsi::Runtime *_runtime;
}

- (nonnull instancetype)init:(facebook::jsi::Runtime &)runtime
{
  if (self = [super init]) {
    _runtime = &runtime;
  }
  return self;
}

- (nonnull facebook::jsi::Runtime *)consume
{
  facebook::jsi::Runtime &runtime = *_runtime;
  _runtime = nullptr;
  return &runtime;
}

@end
