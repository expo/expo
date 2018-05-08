#import "EXShellManager.h"
#import "EXShellManager+Tests.h"
#import "EXShellManagerMocks.h"

@implementation EXShellManagerMocks

#pragma mark - mock environment presets

+ (void)loadExpoClientConfig
{
  [[EXShellManager sharedInstance] _loadShellConfig:@{}
                                      withInfoPlist:[EXShellManagerMocks _expoClientInfoPlist]
                                  withExpoKitDevUrl:nil
                                         isDetached:NO
                                 isDebugXCodeScheme:NO
                                       isUserDetach:NO];
}

+ (void)loadProdServiceConfig
{
  [[EXShellManager sharedInstance] _loadShellConfig:[EXShellManagerMocks shellConfig]
                    withInfoPlist:[EXShellManagerMocks infoPlist]
                withExpoKitDevUrl:nil
                       isDetached:YES
               isDebugXCodeScheme:NO
                     isUserDetach:NO];
}

+ (void)loadDevDetachConfig
{
  [[EXShellManager sharedInstance] _loadShellConfig:[EXShellManagerMocks shellConfig]
                    withInfoPlist:[EXShellManagerMocks infoPlist]
                withExpoKitDevUrl:[EXShellManagerMocks expoKitDevUrl]
                       isDetached:YES
               isDebugXCodeScheme:YES
                     isUserDetach:YES];
}

#pragma mark - mock config data

+ (NSMutableDictionary *)shellConfig
{
  return [@{
    @"isShell": @YES,
    @"manifestUrl": @"https://exp.host/@community/native-component-list",
  } mutableCopy];
}

+ (NSString *)prodUrlScheme
{
  return @"ncl";
}
 
+ (NSString *)expoKitDevUrl
{
  return [NSString stringWithFormat:@"%@://%@", [self prodUrlScheme], @"localhost:19000"];
}
 
+ (NSMutableDictionary *)infoPlist
{
  return [@{
    @"CFBundleURLTypes": @[
      @{
        @"CFBundleURLSchemes": @[
          [self prodUrlScheme],
        ],
      },
    ],
  } mutableCopy];
}

+ (NSMutableDictionary *)_expoClientInfoPlist
{
  return [@{
    @"CFBundleURLTypes": @[
      @{
        @"CFBundleURLSchemes": @[ @"exp", @"exps" ],
      },
    ],
  } mutableCopy];
}

 @end
