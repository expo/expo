// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBarCodeScanner/EXBarCodeScannerViewManager.h>
#import <EXBarCodeScanner/EXBarCodeScannerView.h>

@interface EXBarCodeScannerViewManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXBarCodeScannerViewManager

UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[EXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

UM_VIEW_PROPERTY(type, NSNumber *, EXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

UM_VIEW_PROPERTY(barCodeTypes, NSArray *, EXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
