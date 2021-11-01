#import <React/RCTEventDispatcher.h>

#if __cplusplus

#import "NativeReanimatedModule.h"

namespace devmenureanimated {
 
std::shared_ptr<devmenureanimated::NativeReanimatedModule> createReanimatedModule(std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

}

#endif
