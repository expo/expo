
#import <Foundation/Foundation.h>
#import <ReactCommon/RCTTurboModule.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
namespace react {

/**
 * Provide the TurboModule class for the given name.
 */
Class REATurboModuleClassProvider(const char *name);

/**
 * Provide a pure C++ instance of a TurboModule, specific to this app.
 */
std::shared_ptr<TurboModule> REATurboModuleProvider(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker);

/**
 * Provide an instance of a ObjCTurboModule, given the ObjC instance, specific to this app.
 */
std::shared_ptr<TurboModule> REATurboModuleProvider(const std::string &name,
                                                         id<RCTTurboModule> instance,
                                                         std::shared_ptr<CallInvoker> jsInvoker);

} // namespace react
} // namespace facebook

NS_ASSUME_NONNULL_END
