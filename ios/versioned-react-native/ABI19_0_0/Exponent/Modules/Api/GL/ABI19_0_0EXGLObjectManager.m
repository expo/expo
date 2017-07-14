// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXGLObjectManager.h"

#import "ABI19_0_0EXGLObject.h"

@interface ABI19_0_0EXGLObjectManager ()

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, ABI19_0_0EXGLObject *> *objects; // Key is `ABI19_0_0EXGLObjectId`

@end

@implementation ABI19_0_0EXGLObjectManager

ABI19_0_0RCT_EXPORT_MODULE(ExponentGLObjectManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _objects = [NSMutableDictionary dictionary];
  }
  return self;
}

// See `ABI19_0_0EXGLObject.h` for the format of `config`

ABI19_0_0RCT_EXPORT_METHOD(createObjectAsync:(NSDictionary *)config
                  resolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject)
{
  ABI19_0_0EXGLObject *exglObj = [ABI19_0_0EXGLObject createWithConfig:config];
  if (!exglObj) {
    reject(@"E_EXGLOBJECT_CREATE", @"Error creating ABI19_0_0EXGLObject, maybe a bad configuration map?", nil);
    return;
  }
  _objects[@(exglObj.exglObjId)] = exglObj;
  resolve(@{ @"exglObjId": @(exglObj.exglObjId) });
}

ABI19_0_0RCT_EXPORT_METHOD(destroyObjectAsync:(NSNumber *)exglObjId)
{
  _objects[exglObjId] = nil;
}

@end
