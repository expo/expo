#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>

#if __cplusplus
#import <ABI44_0_0RNReanimated/NativeReanimatedModule.h>
#include <memory>

namespace ABI44_0_0reanimated {

std::shared_ptr<ABI44_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI44_0_0RCTBridge *bridge,
    std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::CallInvoker> jsInvoker);

}

#endif
