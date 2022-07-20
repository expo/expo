#if __cplusplus

#import "DevMenuNativeReanimatedModule.h"
#import <React/RCTEventDispatcher.h>
#include <memory>

namespace devmenureanimated {

std::shared_ptr<devmenureanimated::NativeReanimatedModule> createDevMenuReanimatedModule(
    RCTBridge *bridge,
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

}

#endif
