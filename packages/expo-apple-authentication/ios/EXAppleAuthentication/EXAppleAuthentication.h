// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>

@import AuthenticationServices;

@interface EXAppleAuthentication : UMExportedModule <ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>

@end
  
