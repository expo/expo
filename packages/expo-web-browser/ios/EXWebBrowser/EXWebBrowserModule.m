// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXWebBrowser/EXWebBrowserModule.h>

@interface EXWebBrowserModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXWebBrowserModule

EX_EXPORT_MODULE(ExpoWebBrowser);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
}

@end
