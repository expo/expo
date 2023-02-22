// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistry.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleListener.h>
#import <ABI48_0_0EXBarCodeScanner/ABI48_0_0EXBarCodeScannerView.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXLegacyExpoViewProtocol.h>

@interface ABI48_0_0EXBarCodeScannerView : UIView <ABI48_0_0EXAppLifecycleListener, ABI48_0_0EXLegacyExpoViewProtocol>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
