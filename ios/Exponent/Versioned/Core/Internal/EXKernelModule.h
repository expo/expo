// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedEventEmitter.h"

@class EXKernelModule;

@protocol EXKernelModuleDelegate <NSObject>

// TODO: ben: kill much of this file

/**
 *  Whether the kernel JS should show any devtools UI or respond to devtools commands.
 */
- (BOOL)kernelModuleShouldEnableDevtools:(EXKernelModule *)module;

/**
 *  Whether the kernel JS should auto reload an experience after it encounters a fatal JS error.
 */
- (BOOL)kernelModuleShouldAutoReloadCurrentTask:(EXKernelModule *)module;

/**
 *  Whether to enable legacy gesture/button for the Expo menu.
 */
- (BOOL)kernelModuleShouldEnableLegacyMenuBehavior:(EXKernelModule *)module;
- (void)kernelModule:(EXKernelModule *)module didSelectEnableLegacyMenuBehavior:(BOOL)isEnabled;

/**
 *  Dictionary of `key` => `user facing label` items to show in the kernel JS dev menu.
 */
- (NSDictionary <NSString *, NSString *> *)devMenuItemsForKernelModule:(EXKernelModule *)module;

- (void)kernelModule:(EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key;

- (void)kernelModuleDidSelectHomeDiagnostics:(EXKernelModule *)module;

- (void)kernelModule:(EXKernelModule *)module didOpenUrl:(NSString *)url;

@end

@interface EXKernelModule : EXScopedEventEmitter

- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end
