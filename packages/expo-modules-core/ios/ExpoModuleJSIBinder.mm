//
//  ExpoModuleJSIBinder.m
//  ExpoModulesCore
//
//  Created by Marc Rousavy on 09.07.21.
//

#import <Foundation/Foundation.h>

#import "EXAppDelegateWrapper.h"
#import "EXModuleRegistryProvider.h"
#import "JSIConverter.h"

#import <React/RCTCxxBridgeDelegate.h>
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

#if __has_include(<React/HermesExecutorFactory.h>)
#import <React/HermesExecutorFactory.h>
typedef facebook::react::HermesExecutorFactory ExecutorFactory;
#else
#import <React/JSCExecutorFactory.h>
typedef facebook::react::JSCExecutorFactory ExecutorFactory;
#endif

#if __has_include(<React/RCTJSIExecutorRuntimeInstaller.h>)
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#define FACTORY_WRAPPER(F) RCTJSIExecutorRuntimeInstaller(F)
#else
#define FACTORY_WRAPPER(F) F
#endif

// BEGIN Required for Reanimated
#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAModule.h>
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
// END Required for Reanimated

// BEGIN Required for Reanimated
@interface RCTEventDispatcher(Reanimated)

- (void)setBridge:(RCTBridge*)bridge;

@end
// END Required for Reanimated

// Extend `RCTCxxBridgeDelegate` to be able to inherit `jsExecutorFactoryForBridge:`.
@interface EXAppDelegateWrapper (JSI) <RCTCxxBridgeDelegate>

@end

@implementation EXAppDelegateWrapper (ExpoModules)

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  using namespace facebook;
  
  // BEGIN Required for Reanimated
  [bridge moduleForClass:[RCTEventDispatcher class]];
  RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
  _bridge_reanimated = bridge;
  // END Required for Reanimated
  
  __weak __typeof(self) weakSelf = self;
  __weak RCTBridge *weakBridge = bridge;
  
  const auto executor = [weakSelf, weakBridge](facebook::jsi::Runtime &runtime) {
    RCTBridge *strongBridge = weakBridge;
    if (!strongBridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    
    // BEGIN Required for Reanimated
    auto reanimatedModule = reanimated::createReanimatedModule(strongBridge.jsCallInvoker);
    runtime.global().setProperty(runtime,
                                 jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                 jsi::Object::createFromHostObject(runtime, reanimatedModule));
    // END Required for Reanimated
    
    auto global = runtime.global();
    auto modulesProxy = jsi::Object(runtime);
    global.setProperty(runtime, "__custom_js_factory_installed", jsi::Value(true));
    
    // Install all Modules
    auto *modules = [[[strongSelf.moduleRegistryAdapter moduleRegistryProvider] moduleRegistry] getAllExportedModules];
    for (EXExportedModule *module : modules) {
      // Create a new object for each module, so e.g.: ExpoModules.AV contains all functions for that module
      auto moduleJsObject = jsi::Object(runtime);
      
      // Install all Constants for this module
      auto constants = [module constantsToExport];
      for (NSString *constantName : constants) {
        id constantValue = [constants objectForKey:constantName];
        auto value = expo::convertObjCObjectToJSIValue(runtime, constantValue);
        moduleJsObject.setProperty(runtime,
                                   constantName.UTF8String,
                                   value);
      }
      
      // Install all Methods for this module
      auto exportedMethods = [module getExportedMethods];
      for (NSString *selectorName : [exportedMethods allKeys]) {
        auto objcName = [exportedMethods objectForKey:selectorName];
        auto jsName = selectorName.UTF8String;
        auto selectorComponents = [[selectorName componentsSeparatedByString:@":"] count];
        // - 3 is for resolver and rejecter of the promise and the last, empty component
        auto selectorArgsCount = (unsigned int)(selectorComponents - 3);
        
        auto func = [jsName, selectorArgsCount](jsi::Runtime &runtime,
                                                const jsi::Value &thisValue,
                                                const jsi::Value *args,
                                                size_t argsCount) -> jsi::Value {
          NSLog(@"Called \"%s\"!", jsName);
          if (selectorArgsCount != argsCount) {
            auto message = "Invalid Arguments: \"" + std::string(jsName) + "\" expects " + std::to_string(selectorArgsCount) + " arguments, but was called with " + std::to_string(argsCount) + "!";
            throw jsi::JSError(runtime, message);
          }
          return jsi::Value::undefined();
        };
        // Install func to Module object, e.g.: ExpoModules.AV.recordAudio()
        moduleJsObject.setProperty(runtime, jsName, jsi::Function::createFromHostFunction(runtime,
                                                                                          jsi::PropNameID::forUtf8(runtime, jsName),
                                                                                          selectorArgsCount,
                                                                                          std::move(func)));
      }
      
      const NSString *exportedModuleName = [[module class] exportedModuleName];
      auto name = exportedModuleName.UTF8String;
      if (modulesProxy.hasProperty(runtime, name)) {
        [NSException raise:@"Tried to register two modules with the same name!" format:@"Module %@ already exists!", exportedModuleName];
      }
      modulesProxy.setProperty(runtime, name, moduleJsObject);
    }
    
    // global.ExpoModules contains all modules. e.g.: global.ExpoModules.AV
    global.setProperty(runtime, "ExpoModules", modulesProxy);
  };
  
  // FACTORY_WRAPPER installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(FACTORY_WRAPPER(executor));
}

@end
