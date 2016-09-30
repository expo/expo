// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"
#import "EXFrameUtils.h"
#import "EXVersions.h"
#import "EXShellManager.h"

@interface EXFrameUtils ()

@property (nonatomic, strong) NSString *versionSymbolPrefix;
@property (nonatomic, strong) NSString *validatedVersion; // redeclare

@property (nonatomic, weak) EXFrame *frame;

@end

@implementation EXFrameUtils

- (instancetype)initWithFrame:(EXFrame *)frame
{
  if (self = [super init]) {
    _frame = frame;
    _versionSymbolPrefix = @"";
    _validatedVersion = nil;
    [self _computeVersionSymbolPrefix];
  }
  return self;
}

+ (NSURL *)ensureUrlHasPort:(NSURL *)url
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  if (components) {
    NSString *host = components.host;
    if (host) {
      if (!components.port) {
        if ([url.scheme isEqualToString:@"https"] || [url.scheme isEqualToString:@"exps"]) {
          components.port = @443;
        } else {
          components.port = @80;
        }
      }
      return [components URL];
    }
  }
  return nil;
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
  
  return @"main";
}

- (NSDictionary *)initialProperties
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  NSMutableDictionary *expProps = [NSMutableDictionary dictionary];

  if (_frame.initialProps) {
    [expProps addEntriesFromDictionary:_frame.initialProps];
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
  _versionSymbolPrefix = [[EXVersions sharedInstance] symbolPrefixForManifest:_frame.manifest];
  _validatedVersion = [[EXVersions sharedInstance] versionForManifest:_frame.manifest];
}

@end
