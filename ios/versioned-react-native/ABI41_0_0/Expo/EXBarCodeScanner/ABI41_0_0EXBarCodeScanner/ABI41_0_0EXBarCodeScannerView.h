// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleListener.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerView.h>

@interface ABI41_0_0EXBarCodeScannerView : UIView <ABI41_0_0UMAppLifecycleListener>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
