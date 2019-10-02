// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMModuleRegistryConsumer.h>
#import <GoogleSignIn/GoogleSignIn.h>

@interface EXGoogleSignIn : UMExportedModule <UMModuleRegistryConsumer, GIDSignInDelegate>
@end
