#import "EXVersionManagerObjC.h"

#import <Expo/RCTAppDelegateUmbrella.h>
#import <React/RCTJavaScriptLoader.h>

@class RCTHost;
@class EXAppContext;

NS_ASSUME_NONNULL_BEGIN

typedef void (^OnLoad)(NSURL *sourceURL, RCTSourceLoadBlock loadCallback);

@interface ExpoAppInstance : RCTDefaultReactNativeFactoryDelegate

@property(atomic, strong, nonnull) NSURL *sourceURL;
@property(atomic, strong, nonnull) EXVersionManagerObjC *manager;
@property(nonatomic, nonnull) OnLoad onLoad;
@property(nonatomic, strong, nonnull) RCTReactNativeFactory *reactNativeFactory;

- (instancetype)initWithSourceURL:(NSURL *)sourceURL manager:(EXVersionManagerObjC *)manager onLoad:(OnLoad)onLoad;

/**
 * Creates a new app context configured for Expo Go.
 */
- (EXAppContext *)createExpoGoAppContext;

@end

NS_ASSUME_NONNULL_END
