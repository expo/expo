// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCellular/EXCellularView.h>
#import <EXCellular/EXCellularViewManager.h>

@interface EXCellularViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXCellularViewManager

EX_EXPORT_MODULE(ExpoCellularViewManager);

- (UIView *)view
{
  return [[EXCellularView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoCellularView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSomethingHappened"];
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
