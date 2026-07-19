#ifndef RNCWebViewModule_h
#define RNCWebViewModule_h

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNCWebViewSpec/RNCWebViewSpec.h"
#endif /* RCT_NEW_ARCH_ENABLED */

#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNCWebViewModule : NSObject <
#ifdef RCT_NEW_ARCH_ENABLED
NativeRNCWebViewModuleSpec
#else
RCTBridgeModule
#endif /* RCT_NEW_ARCH_ENABLED */
>
@end

NS_ASSUME_NONNULL_END

#endif /* RNCWebViewModule_h */
