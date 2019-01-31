// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXWebBrowser/EXWebBrowserView.h>
#import <EXWebBrowser/EXWebBrowserViewManager.h>

@interface EXWebBrowserViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXWebBrowserViewManager

EX_EXPORT_MODULE(ExpoWebBrowserViewManager);

- (UIView *)view
{
  return [[EXWebBrowserView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoWebBrowserView";
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
