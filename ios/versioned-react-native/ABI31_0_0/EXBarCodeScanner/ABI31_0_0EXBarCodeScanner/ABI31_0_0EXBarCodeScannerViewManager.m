// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXBarCodeScanner/ABI31_0_0EXBarCodeScannerViewManager.h>
#import <ABI31_0_0EXBarCodeScanner/ABI31_0_0EXBarCodeScannerView.h>

@interface ABI31_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI31_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI31_0_0EXBarCodeScannerViewManager

ABI31_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI31_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI31_0_0EX_VIEW_PROPERTY(type, NSNumber *, ABI31_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI31_0_0EX_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI31_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
