
#import "ABI39_0_0REATurboModuleProvider.h"
#import "ABI39_0_0NativeProxy.h"
#import <ABI39_0_0React/ABI39_0_0CoreModulesPlugins.h>
#import "ABI39_0_0NativeReanimatedModule.h"
#import <ABI39_0_0jsi/ABI39_0_0JSCRuntime.h>

// NOTE: This entire file should be codegen'ed.

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

Class ABI39_0_0REATurboModuleClassProvider(const char *name) {
  return ABI39_0_0RCTCoreModulesClassProvider(name);
}

std::shared_ptr<TurboModule> ABI39_0_0REATurboModuleProvider(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker) {
  if (name == "NativeReanimated") {
    return ABI39_0_0reanimated::createReanimatedModule(jsInvoker);
  }

  return nullptr;
}

std::shared_ptr<TurboModule> ABI39_0_0REATurboModuleProvider(const std::string &name,
                                                         id<ABI39_0_0RCTTurboModule> instance,
                                                         std::shared_ptr<CallInvoker> jsInvoker) {
  return nullptr;
}

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
