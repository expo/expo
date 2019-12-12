// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXBarCodeScanner/ABI36_0_0EXBarCodeScannerViewManager.h>
#import <ABI36_0_0EXBarCodeScanner/ABI36_0_0EXBarCodeScannerView.h>

@interface ABI36_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI36_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI36_0_0EXBarCodeScannerViewManager

ABI36_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI36_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI36_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI36_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI36_0_0UM_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI36_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
