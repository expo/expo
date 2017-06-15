// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI18_0_0/ABI18_0_0RCTEventEmitter.h>

@class ABI18_0_0EXKernelModule;

@protocol ABI18_0_0EXKernelModuleDelegate <NSObject>

- (void)kernelModule: (ABI18_0_0EXKernelModule *)module taskDidForegroundWithType: (NSInteger)type params: (NSDictionary *)params;
- (void)kernelModule:(ABI18_0_0EXKernelModule *)module
didRequestManifestWithUrl:(NSURL *)url
         originalUrl:(NSURL *)originalUrl
             success:(void (^)(NSString *manifestString))success
             failure:(void (^)(NSError *err))failure;

/**
 *  Whether the kernel JS should show any devtools UI or respond to devtools commands.
 */
- (BOOL)kernelModuleShouldEnableDevtools:(ABI18_0_0EXKernelModule *)module;

/**
 *  Whether the kernel JS should auto reload an experience after it encounters a fatal JS error.
 */
- (BOOL)kernelModuleShouldAutoReloadCurrentTask:(ABI18_0_0EXKernelModule *)module;

/**
 *  Whether to enable legacy gesture/button for the Expo menu.
 */
- (BOOL)kernelModuleShouldEnableLegacyMenuBehavior:(ABI18_0_0EXKernelModule *)module;
- (void)kernelModule:(ABI18_0_0EXKernelModule *)module didSelectEnableLegacyMenuBehavior:(BOOL)isEnabled;

/**
 *  Dictionary of `key` => `user facing label` items to show in the kernel JS dev menu.
 */
- (NSDictionary <NSString *, NSString *> *)devMenuItemsForKernelModule:(ABI18_0_0EXKernelModule *)module;

- (void)kernelModule:(ABI18_0_0EXKernelModule *)module didSelectDevMenuItemWithKey:(NSString *)key;

// TODO: kill this as an ABI18_0_0RCTDevSettings followup
- (void)kernelModuleDidSelectKernelDevMenu: (ABI18_0_0EXKernelModule *)module DEPRECATED_ATTRIBUTE;

@end

@interface ABI18_0_0EXKernelModule : ABI18_0_0RCTEventEmitter

@property (nonatomic, assign) id<ABI18_0_0EXKernelModuleDelegate> delegate;

- (instancetype)initWithVersions: (NSArray *)supportedSdkVersions;
- (void)dispatchJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^)(NSDictionary *))success
              onFailure: (void (^)(NSString *))failure;

@end
