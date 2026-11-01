// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXDefines.h>

NS_SWIFT_NAME(JSUtils)
@interface EXJSUtils : NSObject

/**
 Emits an event with the given name and arguments on the specified JS object.
 The runtimePointer is a raw pointer to `facebook::jsi::Runtime`.
 The objectPointer is a raw pointer to `facebook::jsi::Value` representing the target JS object.
 */
+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
    withArguments:(nonnull NSArray<id> *)arguments;

/**
 Same as above, but the objectPointer is a raw pointer to `facebook::jsi::Object` (the target JS object)
 and the arguments are passed as a raw `facebook::jsi::Value` pointer and count.
 */
+ (void)emitEvent:(nonnull NSString *)eventName
   runtimePointer:(nonnull void *)runtimePointer
    objectPointer:(nonnull const void *)objectPointer
 argumentsPointer:(nullable const void *)argumentsPointer
    argumentCount:(NSUInteger)argumentCount;

@end

EX_EXTERN_C_BEGIN

/**
 Same as `+[EXJSUtils emitEvent:runtimePointer:objectPointer:argumentsPointer:argumentCount:]`, but the event
 name is a null-terminated UTF-8 string, and the call needs no Objective-C message.
 */
void EXJSUtilsEmitEvent(const char *_Nonnull eventName,
                        void *_Nonnull runtimePointer,
                        const void *_Nonnull objectPointer,
                        const void *_Nullable argumentsPointer,
                        size_t argumentCount)
  NS_SWIFT_NAME(emitJSEvent(utf8Name:runtimePointer:objectPointer:argumentsPointer:argumentCount:));

/**
 Function that an event emitter calls when the first listener for an event is added (`isListening` is `true`)
 and when the last listener for an event is removed (`isListening` is `false`).
 */
typedef void (*EXJSListeningHook)(void *_Nonnull context, const char *_Nonnull eventName, bool isListening);

/**
 Sets the listening hook of the event emitter object. The objectPointer is a raw pointer to `facebook::jsi::Object`.
 The emitter calls `releaseContext` with the context when it no longer needs the hook.
 */
void EXJSUtilsSetListeningHook(void *_Nonnull runtimePointer,
                               const void *_Nonnull objectPointer,
                               void *_Nonnull context,
                               EXJSListeningHook _Nonnull hook,
                               void (*_Nonnull releaseContext)(void *_Nonnull))
  NS_SWIFT_NAME(setJSListeningHook(runtimePointer:objectPointer:context:hook:releaseContext:));

EX_EXTERN_C_END
