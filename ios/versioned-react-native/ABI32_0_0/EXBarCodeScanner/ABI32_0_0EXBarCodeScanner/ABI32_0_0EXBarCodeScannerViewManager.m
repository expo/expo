// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerViewManager.h>
#import <ABI32_0_0EXBarCodeScanner/ABI32_0_0EXBarCodeScannerView.h>

@interface ABI32_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI32_0_0EXBarCodeScannerViewManager

ABI32_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI32_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI32_0_0EX_VIEW_PROPERTY(type, NSNumber *, ABI32_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI32_0_0EX_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI32_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
