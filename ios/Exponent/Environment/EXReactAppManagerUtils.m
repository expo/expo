// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"
#import "EXReactAppManagerUtils.h"
#import "EXVersions.h"
#import "EXShellManager.h"

@interface EXReactAppManagerUtils ()

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong) NSString *validatedVersion; // redeclare

@property (nonatomic, weak) EXFrame *frame;
@property (nonatomic, assign) BOOL isKernel;

@end

@implementation EXReactAppManagerUtils

- (instancetype)initWithFrame:(EXFrame *)frame isKernel:(BOOL)isKernel
{
  if (self = [super init]) {
    _isKernel = isKernel;
    _frame = frame;
    _versionSymbolPrefix = @"";
    _validatedVersion = nil;
    [self _computeVersionSymbolPrefix];
  }
  return self;
}

- (Class)versionedClassFromString: (NSString *)classString
{
  return NSClassFromString([self versionedString:classString]);
}

- (NSString *)versionedString: (NSString *)string
{
  return [EXVersions versionedString:string withPrefix:_versionSymbolPrefix];
}

- (NSString *)computedApplicationKey
{
  if (_isKernel) {
    return @"ExponentApp";
  } else if (_frame) {
    NSDictionary *manifest = _frame.manifest;
    if (manifest && manifest[@"appKey"]) {
      return manifest[@"appKey"];
    }
    
    if (_frame.source) {
      NSURLComponents *components = [NSURLComponents componentsWithURL:_frame.source resolvingAgainstBaseURL:YES];
      NSArray<NSURLQueryItem *> *queryItems = components.queryItems;
      for (NSURLQueryItem *item in queryItems) {
        if ([item.name isEqualToString:@"app"]) {
          return item.value;
        }
      }
    }
  }
  
  return @"main";
}

- (NSDictionary *)initialProperties
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];

  if (_frame && _frame.initialProps) {
    [expProps addEntriesFromDictionary:_frame.initialProps];
  }
  if (_isKernel) {
    if ([EXShellManager sharedInstance].isShell) {
      [props addEntriesFromDictionary:@{
                                        @"shell": @YES,
                                        @"shellManifestUrl": [EXShellManager sharedInstance].shellManifestUrl,
                                        }];
    }
  }

  props[@"exp"] = expProps;

  return props;
}

- (BOOL)doesManifestEnableDeveloperTools
{
  NSDictionary *manifest = _frame.manifest;
  if (manifest) {
    NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
    BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
    return (isDeployedFromTool);
  }
  return false;
}

#pragma mark - internal

- (void)_computeVersionSymbolPrefix
{
  if (_isKernel) {
    _versionSymbolPrefix = @"";
    _validatedVersion = @"";
  } else {
    _versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForManifest:_frame.manifest];
    _validatedVersion = [[EXVersions sharedInstance] versionForManifest:_frame.manifest];
  }
}

@end
