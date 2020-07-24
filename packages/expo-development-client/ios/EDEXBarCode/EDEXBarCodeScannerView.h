// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <EDUMModuleRegistry.h>
#import <EDUMAppLifecycleListener.h>
#import <EDEXBarCodeScannerView.h>

@interface EDEXBarCodeScannerView : UIView <EDUMAppLifecycleListener>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(EDUMModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
