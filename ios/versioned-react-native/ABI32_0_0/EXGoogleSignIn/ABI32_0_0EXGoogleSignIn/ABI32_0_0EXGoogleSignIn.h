// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

@import GoogleSignIn;

@interface ABI32_0_0EXGoogleSignIn : ABI32_0_0EXExportedModule <ABI32_0_0EXModuleRegistryConsumer, GIDSignInDelegate, GIDSignInUIDelegate>
@end
