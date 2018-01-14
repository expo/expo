// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXGLObjectManager.h"

#import "ABI25_0_0EXGLObject.h"

@interface ABI25_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI25_0_0EXGLObject *> *objects; // Key is `ABI25_0_0EXGLObjectId`

@end

@implementation ABI25_0_0EXGLObjectManager

ABI25_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

// See `ABI25_0_0EXGLObject.h` for the format of `config`

ABI25_0_0RCT_EXPORT_METHOD(createObjectAsync:(NSDictionary *)config
                  resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  ABI25_0_0EXGLObject *exglObj = [ABI25_0_0EXGLObject createWithConfig:config];
  if (!exglObj) {
    reject(@"E_EXGLOBJECT_CREATE", @"Error creating ABI25_0_0EXGLObject, maybe a bad configuration map?", nil);
    return;
  }
  _objects[@(exglObj.exglObjId)] = exglObj;
  resolve(@{ @"exglObjId": @(exglObj.exglObjId) });
}

ABI25_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

@end
