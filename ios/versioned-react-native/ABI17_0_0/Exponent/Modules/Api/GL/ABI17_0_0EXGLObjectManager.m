// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXGLObjectManager.h"

#import "ABI17_0_0EXGLObject.h"

@interface ABI17_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI17_0_0EXGLObject *> *objects; // Key is `ABI17_0_0EXGLObjectId`

@end

@implementation ABI17_0_0EXGLObjectManager

ABI17_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

// See `ABI17_0_0EXGLObject.h` for the format of `config`

ABI17_0_0RCT_EXPORT_METHOD(createObjectAsync:(NSDictionary *)config
                  resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  ABI17_0_0EXGLObject *exglObj = [ABI17_0_0EXGLObject createWithConfig:config];
  if (!exglObj) {
    reject(@"E_EXGLOBJECT_CREATE", @"Error creating ABI17_0_0EXGLObject, maybe a bad configuration map?", nil);
    return;
  }
  _objects[@(exglObj.exglObjId)] = exglObj;
  resolve(@{ @"exglObjId": @(exglObj.exglObjId) });
}

ABI17_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

@end
