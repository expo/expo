#import "EXReactAppManager+Private.h"
#import "EXAbstractLoader.h"
#import "EXSplashScreenService.h"
#import "EXAppViewController.h"
#import "EXKernel.h"
#import <EXConstants/EXConstantsService.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import "Expo_Go-Swift.h"

@implementation EXHomeAppManager
{
  HomeViewController *_swiftUIViewController;
}

- (UIView *)rootView
{
  if (!_swiftUIViewController) {
    _swiftUIViewController = [[HomeViewController alloc] init];
  }
  return _swiftUIViewController.view;
}

- (void)invalidate
{
  _swiftUIViewController = nil;
  [super invalidate];
}

- (NSDictionary *)extraParams
{
  return [@{
    @"constants": @{
        @"expoRuntimeVersion": [EXBuildConstants sharedInstance].expoRuntimeVersion,
        @"linkingUri": @"exp://",
        @"experienceUrl": [@"exp://" stringByAppendingString:(self.appRecord.appLoader.manifest.hostUri ?: @"")],
        @"manifest": self.appRecord.appLoader.manifest.rawManifestJSON,
        @"executionEnvironment": EXConstantsExecutionEnvironmentStoreClient,
        @"appOwnership": @"expo",
        @"supportedExpoSdks": @[[EXVersions sharedInstance].sdkVersion],
    },
    @"exceptionsManagerDelegate": self.exceptionHandler,
    @"isDeveloper": @([EXBuildConstants sharedInstance].isDevKernel),
    @"isStandardDevMenuAllowed": @(YES), 
    @"manifest": self.appRecord.appLoader.manifest.rawManifestJSON,
    @"services": [EXKernel sharedInstance].serviceRegistry.allServices,
    @"singletonModules": [EXModuleRegistryProvider singletonModules],
    @"fileSystemDirectories": @{
        @"documentDirectory": [self scopedDocumentDirectory],
        @"cachesDirectory": [self scopedCachesDirectory]
    }
  } mutableCopy];
}

- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(EXManifestsManifest *)manifest {}

- (NSString *)bundleResourceNameForAppFetcher:(__unused EXAppFetcher *)appFetcher withManifest:(nonnull __unused EXManifestsManifest *)manifest
{
  return nil;
}

- (void)getHistoryUrlForScopeKey:(NSString *)scopeKey completion:(void (^)(NSString *))completion
{
  if (completion) {
    completion(nil);
  }
}

- (void)dispatchForegroundHomeEvent {}

- (void)rebuildHost
{
  if (self.delegate && [self.delegate respondsToSelector:@selector(reactAppManagerIsReadyForLoad:)]) {
    [self.delegate reactAppManagerIsReadyForLoad:self];

    EXAppViewController *viewController = (EXAppViewController *)self.delegate;
    BOOL isHomeApp = viewController.appRecord == [EXKernel sharedInstance].appRegistry.homeAppRecord;

    if (isHomeApp) {
      dispatch_async(dispatch_get_main_queue(), ^{
        EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
        if (self.delegate && [self.delegate respondsToSelector:@selector(reactAppManagerAppContentDidAppear:)]) {
          [splashScreenService onAppContentDidAppear:(UIViewController *)self.delegate];
        }
      });
    }
  }
}

- (EXReactAppManagerStatus)status
{
  return kEXReactAppManagerStatusRunning;
}

@end
