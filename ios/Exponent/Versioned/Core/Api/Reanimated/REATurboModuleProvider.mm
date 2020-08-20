
#import "REATurboModuleProvider.h"
#import "NativeProxy.h"
#import <React/CoreModulesPlugins.h>
#import "NativeReanimatedModule.h"
#import <jsi/JSCRuntime.h>

// NOTE: This entire file should be codegen'ed.

namespace facebook {
namespace react {

Class REATurboModuleClassProvider(const char *name) {
  return RCTCoreModulesClassProvider(name);
}

std::shared_ptr<TurboModule> REATurboModuleProvider(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker) {
  if (name == "NativeReanimated") {
    return reanimated::createReanimatedModule(jsInvoker);
  }

  return nullptr;
}

std::shared_ptr<TurboModule> REATurboModuleProvider(const std::string &name,
                                                         id<RCTTurboModule> instance,
                                                         std::shared_ptr<CallInvoker> jsInvoker) {
  return nullptr;
}

} // namespace react
} // namespace facebook
