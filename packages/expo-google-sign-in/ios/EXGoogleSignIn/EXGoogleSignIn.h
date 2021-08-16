// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <GoogleSignIn/GoogleSignIn.h>

@interface EXGoogleSignIn : EXExportedModule <EXModuleRegistryConsumer, GIDSignInDelegate>
@end
