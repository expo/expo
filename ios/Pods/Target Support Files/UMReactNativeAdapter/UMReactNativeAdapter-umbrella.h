#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "UMReactFontManager.h"
#import "UMReactLogHandler.h"
#import "UMReactNativeAdapter.h"
#import "UMReactNativeEventEmitter.h"
#import "UMBridgeModule.h"
#import "UMModuleRegistryAdapter.h"
#import "UMModuleRegistryHolderReactModule.h"
#import "UMViewManagerAdapterClassesRegistry.h"
#import "UMNativeModulesProxy.h"
#import "UMViewManagerAdapter.h"

FOUNDATION_EXPORT double UMReactNativeAdapterVersionNumber;
FOUNDATION_EXPORT const unsigned char UMReactNativeAdapterVersionString[];

