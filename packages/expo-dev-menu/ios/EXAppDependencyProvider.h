#import <Foundation/Foundation.h>

#if __has_include(<React-RCTAppDelegate/RCTDependencyProvider.h>)
#import <React-RCTAppDelegate/RCTDependencyProvider.h>
#define HAS_RCT_DEPENDENCY_PROVIDER 1
#elif __has_include(<React_RCTAppDelegate/RCTDependencyProvider.h>)
#import <React_RCTAppDelegate/RCTDependencyProvider.h>
#define HAS_RCT_DEPENDENCY_PROVIDER 1
#else
#define HAS_RCT_DEPENDENCY_PROVIDER 0
#endif

NS_ASSUME_NONNULL_BEGIN

#if HAS_RCT_DEPENDENCY_PROVIDER
@interface EXAppDependencyProvider : NSObject <RCTDependencyProvider>
#else
@interface EXAppDependencyProvider : NSObject
#endif

@end

NS_ASSUME_NONNULL_END
