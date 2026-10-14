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

+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
 argumentsPointer:(nullable const void *)argumentsPointer
    argumentCount:(NSUInteger)argumentCount
{
  EXJSUtilsEmitEvent([eventName UTF8String], runtimePointer, objectPointer, argumentsPointer, argumentCount);
}

@end

void EXJSUtilsEmitEvent(const char *eventName,
                        void *runtimePointer,
                        const void *objectPointer,
                        const void *argumentsPointer,
                        size_t argumentCount)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &object = *static_cast<const jsi::Object *>(objectPointer);

  if (argumentCount == 0 || argumentsPointer == nullptr) {
    expo::EventEmitter::emitEvent(runtime, object, eventName, nullptr, 0);
    return;
  }

  auto *args = static_cast<const jsi::Value *>(argumentsPointer);
  expo::EventEmitter::emitEvent(runtime, object, eventName, args, argumentCount);
}
