#import <ExpoModulesCore/EXJSUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EventEmitter.h>

@implementation EXJSUtils

+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
    withArguments:(nonnull NSArray<id> *)arguments
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto object = static_cast<const jsi::Value *>(objectPointer)->asObject(runtime);

  std::vector<jsi::Value> jsiArguments;
  jsiArguments.reserve(arguments.count);

  for (id argument in arguments) {
    jsiArguments.emplace_back(expo::convertObjCObjectToJSIValue(runtime, argument));
  }

  expo::EventEmitter::emitEvent(runtime, object, [eventName UTF8String], jsiArguments);
}

@end
