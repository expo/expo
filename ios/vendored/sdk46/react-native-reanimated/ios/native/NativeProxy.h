#if __cplusplus

#import <ABI46_0_0RNReanimated/NativeReanimatedModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcher.h>
#include <memory>

namespace ABI46_0_0reanimated {

std::shared_ptr<ABI46_0_0reanimated::NativeReanimatedModule> createReanimatedModule(
    ABI46_0_0RCTBridge *bridge,
    std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::CallInvoker> jsInvoker);

}

#endif
