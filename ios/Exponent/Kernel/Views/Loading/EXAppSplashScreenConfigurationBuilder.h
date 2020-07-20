#import <Foundation/Foundation.h>
#import <EXSplashScreen/EXSplashScreenConfiguration.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXAppSplashScreenConfigurationBuilder : NSObject

+ (EXSplashScreenConfiguration *)parseManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END
