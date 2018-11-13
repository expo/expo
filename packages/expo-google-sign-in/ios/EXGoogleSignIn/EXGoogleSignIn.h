// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXModuleRegistryConsumer.h>
#import <GoogleSignIn/GoogleSignIn.h>

@interface EXGoogleSignIn : EXExportedModule <EXModuleRegistryConsumer, GIDSignInDelegate, GIDSignInUIDelegate>
@end
