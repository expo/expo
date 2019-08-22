
#import <UMCore/UMExportedModule.h>

@import AuthenticationServices;

@interface RNCAppleAuthentication : NSObject <RCTBridgeModule, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>

@end
  
