// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXBarCodeScanner/ABI37_0_0EXBarCodeScannerViewManager.h>
#import <ABI37_0_0EXBarCodeScanner/ABI37_0_0EXBarCodeScannerView.h>

@interface ABI37_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0EXBarCodeScannerViewManager

ABI37_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI37_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI37_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI37_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI37_0_0UM_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI37_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
