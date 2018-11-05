// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScannerViewManager.h>
#import <ABI30_0_0EXBarCodeScanner/ABI30_0_0EXBarCodeScannerView.h>

@interface ABI30_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI30_0_0EXBarCodeScannerViewManager

ABI30_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI30_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI30_0_0EX_VIEW_PROPERTY(type, NSNumber *, ABI30_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI30_0_0EX_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI30_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
