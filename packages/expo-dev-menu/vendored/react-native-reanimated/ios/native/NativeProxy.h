#if __cplusplus

#import "NativeReanimatedModule.h"
#import <React/RCTEventDispatcher.h>
#include <memory>

namespace devmenureanimated {

std::shared_ptr<devmenureanimated::NativeReanimatedModule> createDevMenuReanimatedModule(
    RCTBridge *bridge,
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

}

#endif
