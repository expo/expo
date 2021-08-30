#import <React/RCTEventDispatcher.h>

#if __cplusplus

#import <RNReanimated/NativeReanimatedModule.h>

namespace reanimated {
 
std::shared_ptr<reanimated::NativeReanimatedModule> createReanimatedModule(std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

}

#endif
