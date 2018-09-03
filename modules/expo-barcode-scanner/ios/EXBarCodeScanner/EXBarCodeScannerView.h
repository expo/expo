// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXAppLifecycleListener.h>
#import <EXBarCodeScanner/EXBarCodeScannerView.h>

@interface EXBarCodeScannerView : UIView <EXAppLifecycleListener>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
