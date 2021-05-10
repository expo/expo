// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppLifecycleListener.h>
#import <ABI39_0_0EXBarCodeScanner/ABI39_0_0EXBarCodeScannerView.h>

@interface ABI39_0_0EXBarCodeScannerView : UIView <ABI39_0_0UMAppLifecycleListener>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
