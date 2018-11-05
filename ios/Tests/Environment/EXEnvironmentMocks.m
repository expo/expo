#import "EXEnvironment.h"
#import "EXEnvironment+Tests.h"
#import "EXEnvironmentMocks.h"

@implementation EXEnvironmentMocks

#pragma mark - mock environment presets

+ (void)loadExpoClientConfig
{
  [[EXEnvironment sharedEnvironment] _loadShellConfig:@{}
                                      withInfoPlist:[EXEnvironmentMocks _expoClientInfoPlist]
                                  withExpoKitDevUrl:nil
                               withEmbeddedManifest:[EXEnvironmentMocks embeddedManifest]
                                         isDetached:NO
                                 isDebugXCodeScheme:NO
                                       isUserDetach:NO];
}

+ (void)loadProdServiceConfig
{
  [[EXEnvironment sharedEnvironment] _loadShellConfig:[EXEnvironmentMocks shellConfig]
                    withInfoPlist:[EXEnvironmentMocks infoPlist]
                withExpoKitDevUrl:nil
             withEmbeddedManifest:[EXEnvironmentMocks embeddedManifest]
                       isDetached:YES
               isDebugXCodeScheme:NO
                     isUserDetach:NO];
}

+ (void)loadDevDetachConfig
{
  [[EXEnvironment sharedEnvironment] _loadShellConfig:[EXEnvironmentMocks shellConfig]
                    withInfoPlist:[EXEnvironmentMocks infoPlist]
                withExpoKitDevUrl:[EXEnvironmentMocks expoKitDevUrl]
             withEmbeddedManifest:[EXEnvironmentMocks embeddedManifest]
                       isDetached:YES
               isDebugXCodeScheme:YES
                     isUserDetach:YES];
}

#pragma mark - mock config data

+ (NSMutableDictionary *)shellConfig
{
  return [@{
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

+ (NSDictionary *)embeddedManifest
{
  return @{
   @"bundleUrl": @"https://d1wp6m56sqw74a.cloudfront.net/%40community%2Fnative-component-list%2F25.1.0%2Fdbe753ef7122562ed798ee55cfa489ed-25.0.0-ios.js"
  };
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
