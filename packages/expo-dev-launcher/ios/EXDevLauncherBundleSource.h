#import <React/RCTJavaScriptLoader.h>

@interface EXDevLauncherBundleSource : RCTSource

@end

EXDevLauncherBundleSource *EXDevLauncherBundleSourceCreate(NSURL *url, NSData *data, int64_t length) NS_RETURNS_RETAINED;
