// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <GoogleSignIn/GoogleSignIn.h>

@interface ABI33_0_0EXGoogleSignIn : ABI33_0_0UMExportedModule <ABI33_0_0UMModuleRegistryConsumer, GIDSignInDelegate, GIDSignInUIDelegate>
@end
