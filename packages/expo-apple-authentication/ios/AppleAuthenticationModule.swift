// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AuthenticationServices
import CoreMedia
import SwiftUI

typealias ButtonType = ASAuthorizationAppleIDButton.ButtonType
typealias ButtonStyle = ASAuthorizationAppleIDButton.Style

public class AppleAuthenticationModule : Module {
  public func definition() -> ModuleDefinition {
    name("ExpoAppleAuthentication")

    function("isAvailableAsync", { () -> Bool in
      if #available(iOS 13, *) {
        return true
      } else {
        return false
      }
    })
    
    function("getCredentialStateAsync", { (userID: String, promise: Promise) -> Void in
      if #available(iOS 13.0, *) {
        return self.getCredentialStateAsync(userID, promise)
      } else {
        return promise.reject(UnavailableError())
      }
    })

    function("signInAsync", { (options: SignInOptions?, promise: Promise) -> Void in
      if #available(iOS 13.0, *) {
        return self.singInAsync(options, promise)
      } else {
        return promise.reject(UnavailableError())
      }
    })
    
    function("refreshAsync", { (options: RefreshOptions, promise: Promise) -> Void in
      if #available(iOS 13.0, *) {
        return self.refreshAsync(options, promise)
      } else {
        return promise.reject(UnavailableError())
      }
    })
    
    function("signOutAsync", { (options: SignOutOptions, promise: Promise) -> Void in
      if #available(iOS 13.0, *) {
        return self.signOutAsync(options, promise)
      } else {
        return promise.reject(UnavailableError())
      }
    })
    
    viewManager {
      name("ExpoAppleAuthenticationButtonSignInWhiteViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signIn, style: .white)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonSignInWhiteOutlineViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signIn, style: .whiteOutline)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonSignInBlackViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signIn, style: .black)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonConntinueWhiteViewManager")
      
      view {
        return AppleAuthenticationButton(type: .continue, style: .white)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonContinueWhiteOutlineViewManager")
      
      view {
        return AppleAuthenticationButton(type: .continue, style: .whiteOutline)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonContinueBlackViewManager")
      
      view {
        return AppleAuthenticationButton(type: .continue, style: .black)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
  
    viewManager {
      name("ExpoAppleAuthenticationButtonSignUpWhiteViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signUp, style: .white)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonSignUpWhiteOutlineViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signUp, style: .whiteOutline)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
    
    viewManager {
      name("ExpoAppleAuthenticationButtonSignUpBlackViewManager")
      
      view {
        return AppleAuthenticationButton(type: .signUp, style: .black)
      }
      
      prop("cornerRadius", { (view: AppleAuthenticationButton, radius: Double) in
        view.cornerRadius = radius
      })
    }
  }
  
  @available(iOS 13.0, *)
  internal func getCredentialStateAsync(_ userID: String, _ promise: Promise) {
    let appleIDProvider = ASAuthorizationAppleIDProvider()
    appleIDProvider.getCredentialState(forUserID: userID) { credentialState, error in
      if (error != nil) {
        return promise.reject(CredentialStateError(cause: error!.localizedDescription))
      } else {
        promise.resolve(mapCredentialState(credentialState))
      }
    }
  }
  
  @available(iOS 13.0, *)
  internal func singInAsync(_ options: SignInOptions?, _ promise: Promise) -> Void {
    let request = AppleAuthenticationRequest { response, error in
      
    }
    request.request(options: Options.signIn(options))
  }
  
  @available(iOS 13.0, *)
  internal func refreshAsync(_ options: RefreshOptions, _ promise: Promise) -> Void {

  }
  
  @available(iOS 13.0, *)
  internal func signOutAsync(_ options: SignOutOptions, _ promise: Promise) -> Void {

  }
}

