// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXAppLifecycleListener.h>
#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerView.h>

@interface ABI32_0_0EXBarCodeScannerView : UIView <ABI32_0_0EXAppLifecycleListener>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
