#if __cplusplus

#import <ABI48_0_0RNReanimated/NativeReanimatedModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#include <memory>

namespace ABI48_0_0reanimated {

std::shared_ptr<ABI48_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI48_0_0RCTBridge *bridge,
    std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::CallInvoker> jsInvoker);

}

#endif
