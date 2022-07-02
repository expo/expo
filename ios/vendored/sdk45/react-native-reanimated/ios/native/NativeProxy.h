#if __cplusplus

#import <ABI45_0_0RNReanimated/NativeReanimatedModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#include <memory>

namespace ABI45_0_0reanimated {

std::shared_ptr<ABI45_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI45_0_0RCTBridge *bridge,
    std::shared_ptr<ABI45_0_0facebook::ABI45_0_0React::CallInvoker> jsInvoker);

}

#endif
