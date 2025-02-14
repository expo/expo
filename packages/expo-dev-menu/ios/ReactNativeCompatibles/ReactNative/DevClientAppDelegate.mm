#import <EXDevMenu/DevClientAppDelegate.h>
#import <EXDevMenu/DevClientRootViewFactory.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTComponentViewFactory.h>
#if __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#endif

#import <EXDevMenu/DevClientNoOpLoadingView.h>


#ifdef RCT_NEW_ARCH_ENABLED
#import <memory>

#import <React/CoreModulesPlugins.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTContextContainerHandling.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

#endif

@implementation DevClientAppDelegate

- (Class)getModuleClassFromName:(const char *)name
{
	// Overrides DevLoadingView as no-op when loading dev-launcher bundle
	if (strcmp(name, "DevLoadingView") == 0) {
		return [DevClientNoOpLoadingView class];
	}
	return [super getModuleClassFromName:name];
}

@end
