#import "EXEnvironment.h"
#import <Foundation/Foundation.h>

@interface EXEnvironment (Tests)

- (void)_loadShellConfig:(NSDictionary *)shellConfig
           withInfoPlist:(NSDictionary *)infoPlist
       withExpoKitDevUrl:(NSString *)expoKitDevelopmentUrl
    withEmbeddedManifest:(NSDictionary *)embeddedManifest
      isDebugXCodeScheme:(BOOL)isDebugScheme;

- (void)_loadDefaultConfig;

@end
