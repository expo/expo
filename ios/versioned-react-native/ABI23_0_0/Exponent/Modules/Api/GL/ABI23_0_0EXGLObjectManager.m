// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXGLObjectManager.h"

#import "ABI23_0_0EXGLObject.h"

@interface ABI23_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI23_0_0EXGLObject *> *objects; // Key is `ABI23_0_0EXGLObjectId`

@end

@implementation ABI23_0_0EXGLObjectManager

ABI23_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

// See `ABI23_0_0EXGLObject.h` for the format of `config`

ABI23_0_0RCT_EXPORT_METHOD(createObjectAsync:(NSDictionary *)config
                  resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject)
{
  ABI23_0_0EXGLObject *exglObj = [ABI23_0_0EXGLObject createWithConfig:config];
  if (!exglObj) {
    reject(@"E_EXGLOBJECT_CREATE", @"Error creating ABI23_0_0EXGLObject, maybe a bad configuration map?", nil);
    return;
  }
  _objects[@(exglObj.exglObjId)] = exglObj;
  resolve(@{ @"exglObjId": @(exglObj.exglObjId) });
}

ABI23_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

@end
