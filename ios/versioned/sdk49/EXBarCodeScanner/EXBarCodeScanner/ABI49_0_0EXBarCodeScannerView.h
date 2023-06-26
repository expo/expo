// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppLifecycleListener.h>
#import <ABI49_0_0EXBarCodeScanner/ABI49_0_0EXBarCodeScannerView.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXLegacyExpoViewProtocol.h>

@interface ABI49_0_0EXBarCodeScannerView : UIView <ABI49_0_0EXAppLifecycleListener, ABI49_0_0EXLegacyExpoViewProtocol>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
