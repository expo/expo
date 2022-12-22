// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <EXBarCodeScanner/EXBarCodeScannerView.h>
#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>

@interface EXBarCodeScannerView : UIView <EXAppLifecycleListener, EXLegacyExpoViewProtocol>

@property (nonatomic, assign) NSInteger presetCamera;
@property (nonatomic, strong) NSArray *barCodeTypes;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (void)onReady;
- (void)onMountingError:(NSDictionary *)event;
- (void)onBarCodeScanned:(NSDictionary *)event;

@end
