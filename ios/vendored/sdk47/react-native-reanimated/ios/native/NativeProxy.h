#if __cplusplus

#import <ABI47_0_0RNReanimated/NativeReanimatedModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#include <memory>

namespace ABI47_0_0reanimated {

std::shared_ptr<ABI47_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI47_0_0RCTBridge *bridge,
    std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::CallInvoker> jsInvoker);

}

#endif
