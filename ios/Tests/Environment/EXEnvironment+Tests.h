#import "EXEnvironment.h"
#import <Foundation/Foundation.h>

@interface EXEnvironment (Tests)

- (void)_loadShellConfig:(NSDictionary *)shellConfig
           withInfoPlist:(NSDictionary *)infoPlist
       withExpoKitDevUrl:(NSString *)expoKitDevelopmentUrl
    withEmbeddedManifest:(NSDictionary *)embeddedManifest
              isDetached:(BOOL)isDetached
      isDebugXCodeScheme:(BOOL)isDebugScheme
            isUserDetach:(BOOL)isUserDetach;

- (void)_loadDefaultConfig;

@end
