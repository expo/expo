// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJavaScriptTypedArray.h>
#import <ExpoModulesCore/TypedArray.h>
#import <ExpoModulesCore/MutableBuffer.h>

@implementation EXJavaScriptTypedArray {
  __weak EXJavaScriptRuntime *_runtime;

  std::shared_ptr<expo::TypedArray> _typedArrayPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(EXJavaScriptRuntime *)runtime
{
  if (self = [super initWith:jsObjectPtr runtime:runtime]) {
    jsi::Runtime *rt = [runtime get];
    _runtime = runtime;
    _typedArrayPtr = std::make_shared<expo::TypedArray>(*rt, *jsObjectPtr.get());
    _kind = (EXTypedArrayKind)_typedArrayPtr->getKind(*rt);
  }
  return self;
}

- (nonnull void *)getUnsafeMutableRawPointer
{
  return _typedArrayPtr->getRawPointer(*[_runtime get]);
}

#pragma mark - Statics

+ (nonnull EXJavaScriptTypedArray *)createArrayBuffer:(nonnull EXJavaScriptRuntime *)runtime withData:(nonnull NSData *)data
{
  __block NSData *retainedData = data;
  uint8_t *bytes = (uint8_t *)[data bytes];
  size_t size = [data length];

  jsi::Runtime *rt = [runtime get];
  std::shared_ptr<expo::MutableBuffer> mutableBuffer = std::make_shared<expo::MutableBuffer>(bytes, size, ^{
    retainedData = nil;
    NSLog(@"deallocated");
  });
  std::shared_ptr<jsi::ArrayBuffer> arrayBuffer = std::make_shared<jsi::ArrayBuffer>(*rt, mutableBuffer);

  jsi::Value typedArrayObject = rt->global()
    .getPropertyAsFunction(*rt, "Uint8ClampedArray")
    .callAsConstructor(*rt, jsi::Value(*rt, *arrayBuffer));

  auto ptr = std::make_shared<jsi::Object>(typedArrayObject.asObject(*rt));

  return [[EXJavaScriptTypedArray alloc] initWith:ptr runtime:runtime];
}

@end
