// Copyright 2016-present 650 Industries. All rights reserved.

#import <EDEXBarCodeScannerViewManager.h>
#import <EDEXBarCodeScannerView.h>

@interface EDEXBarCodeScannerViewManager ()

@property (nonatomic, weak) EDUMModuleRegistry *moduleRegistry;

@end

@implementation EDEXBarCodeScannerViewManager

EDUM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExpoDevelopmentClientExpoBarCodeScannerView";
}

- (NSString *)viewName
{
  return @"ExpoDevelopmentClientExpoBarCodeScannerView";
}

- (void)setModuleRegistry:(EDUMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [[EDEXBarCodeScannerView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
           @"onBarCodeScanned",
           ];
}

EDUM_VIEW_PROPERTY(type, NSNumber *, EDEXBarCodeScannerView)
{
  [view setPresetCamera:[value integerValue]];
}

EDUM_VIEW_PROPERTY(barCodeTypes, NSArray *, EDEXBarCodeScannerView)
{
  [view setBarCodeTypes:value];
}

@end
