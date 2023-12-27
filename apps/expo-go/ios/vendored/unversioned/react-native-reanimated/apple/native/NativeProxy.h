#if __cplusplus

#import <RNReanimated/NativeReanimatedModule.h>
#import <React/RCTEventDispatcher.h>
#include <memory>

namespace reanimated {

std::shared_ptr<reanimated::NativeReanimatedModule> createReanimatedModule(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::CallInvoker> &jsInvoker);

}

#endif
