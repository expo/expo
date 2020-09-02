
#import <Foundation/Foundation.h>
#import <ABI39_0_0ReactCommon/ABI39_0_0RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

/**
 * Provide the TurboModule class for the given name.
 */
Class ABI39_0_0REATurboModuleClassProvider(const char *name);

/**
 * Provide a pure C++ instance of a TurboModule, specific to this app.
 */
std::shared_ptr<TurboModule> ABI39_0_0REATurboModuleProvider(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker);

/**
 * Provide an instance of a ObjCTurboModule, given the ObjC instance, specific to this app.
 */
std::shared_ptr<TurboModule> ABI39_0_0REATurboModuleProvider(const std::string &name,
                                                         id<ABI39_0_0RCTTurboModule> instance,
                                                         std::shared_ptr<CallInvoker> jsInvoker);

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook

NS_ASSUME_NONNULL_END
