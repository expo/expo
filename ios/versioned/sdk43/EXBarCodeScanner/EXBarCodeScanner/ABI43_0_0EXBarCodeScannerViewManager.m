// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScannerViewManager.h>
#import <ABI43_0_0EXBarCodeScanner/ABI43_0_0EXBarCodeScannerView.h>

@interface ABI43_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXBarCodeScannerViewManager

ABI43_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI43_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI43_0_0EX_VIEW_PROPERTY(type, NSNumber *, ABI43_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI43_0_0EX_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI43_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
