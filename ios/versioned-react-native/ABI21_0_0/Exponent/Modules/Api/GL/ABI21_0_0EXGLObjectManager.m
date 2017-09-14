// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXGLObjectManager.h"

#import "ABI21_0_0EXGLObject.h"

@interface ABI21_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI21_0_0EXGLObject *> *objects; // Key is `ABI21_0_0EXGLObjectId`

@end

@implementation ABI21_0_0EXGLObjectManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

// See `ABI21_0_0EXGLObject.h` for the format of `config`

ABI21_0_0RCT_EXPORT_METHOD(createObjectAsync:(NSDictionary *)config
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  ABI21_0_0EXGLObject *exglObj = [ABI21_0_0EXGLObject createWithConfig:config];
  if (!exglObj) {
    reject(@"E_EXGLOBJECT_CREATE", @"Error creating ABI21_0_0EXGLObject, maybe a bad configuration map?", nil);
    return;
  }
  _objects[@(exglObj.exglObjId)] = exglObj;
  resolve(@{ @"exglObjId": @(exglObj.exglObjId) });
}

ABI21_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(nonnull NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

@end
