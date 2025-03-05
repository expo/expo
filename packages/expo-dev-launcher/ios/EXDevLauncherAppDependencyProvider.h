#import <Foundation/Foundation.h>

#if __has_include(<React-RCTAppDelegate/RCTDependencyProvider.h>)
#import <React-RCTAppDelegate/RCTDependencyProvider.h>
#elif __has_include(<React_RCTAppDelegate/RCTDependencyProvider.h>)
#import <React_RCTAppDelegate/RCTDependencyProvider.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXDevLauncherAppDependencyProvider : NSObject <RCTDependencyProvider>

@end

NS_ASSUME_NONNULL_END
