#import "EXVersionManagerObjC.h"

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

#import <React/RCTJavaScriptLoader.h>

@class RCTHost;

NS_ASSUME_NONNULL_BEGIN

typedef void (^OnLoad)(NSURL *sourceURL, RCTSourceLoadBlock loadCallback);

@interface ExpoAppInstance : RCTAppDelegate

@property(atomic, strong) NSURL* sourceURL;
@property(atomic, strong) EXVersionManagerObjC* manager;
@property (nonatomic, nonnull) OnLoad onLoad;

- (instancetype)initWithSourceURL:(NSURL *)sourceURL manager:(EXVersionManagerObjC *)manager onLoad:(OnLoad)onLoad;

- (RCTRootViewFactory *)createRCTRootViewFactory;

@end

NS_ASSUME_NONNULL_END
