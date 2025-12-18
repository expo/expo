#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>
#import <ExpoModulesJSI/EXJSIConversions.h>

#import <ExpoModulesCore/EXJSUtils.h>
#import <ExpoModulesCore/NativeModule.h>
#import <ExpoModulesCore/EventEmitter.h>

@implementation EXJSUtils

+ (nonnull EXJavaScriptObject *)createNativeModuleObject:(nonnull EXJavaScriptRuntime *)runtime
{
  std::shared_ptr<jsi::Object> nativeModule = std::make_shared<jsi::Object>(expo::NativeModule::createInstance(*[runtime get]));
  return [[EXJavaScriptObject alloc] initWith:nativeModule runtime:runtime];
}

+ (void)emitEvent:(nonnull NSString *)eventName
         toObject:(nonnull EXJavaScriptObject *)object
    withArguments:(nonnull NSArray<id> *)arguments
        inRuntime:(nonnull EXJavaScriptRuntime *)runtime
{
  const std::vector<jsi::Value> argumentsVector(expo::convertNSArrayToStdVector(*[runtime get], arguments));
  expo::EventEmitter::emitEvent(*[runtime get], *[object get], [eventName UTF8String], std::move(argumentsVector));
}

@end
