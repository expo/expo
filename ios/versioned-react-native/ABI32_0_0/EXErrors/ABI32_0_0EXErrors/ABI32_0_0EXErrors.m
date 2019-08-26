// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXErrors/ABI32_0_0EXErrors.h>

void ABI32_0_0EXRejectInvalidArgument(ABI32_0_0EXPromiseRejectBlock rejecter, NSString *message)
{
  rejecter(@"ERR_INVALID_ARGUMENT", message, nil);
}
