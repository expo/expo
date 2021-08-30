// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerViewManager.h>
#import <ABI41_0_0EXBarCodeScanner/ABI41_0_0EXBarCodeScannerView.h>

@interface ABI41_0_0EXBarCodeScannerViewManager ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXBarCodeScannerViewManager

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[ABI41_0_0EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

ABI41_0_0UM_VIEW_PROPERTY(type, NSNumber *, ABI41_0_0EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

ABI41_0_0UM_VIEW_PROPERTY(barCodeTypes, NSArray *, ABI41_0_0EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
