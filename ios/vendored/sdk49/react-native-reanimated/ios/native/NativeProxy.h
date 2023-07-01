#if __cplusplus

#import <ABI49_0_0RNReanimated/NativeReanimatedModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#include <memory>

namespace ABI49_0_0reanimated {

std::shared_ptr<ABI49_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI49_0_0RCTBridge *bridge,
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> jsInvoker);

}

#endif
