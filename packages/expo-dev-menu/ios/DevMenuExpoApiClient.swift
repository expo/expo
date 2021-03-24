// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

class DevMenuExpoApiClient: NSObject, DevMenuExpoApiClientProtocol {
  private static let authHeader = "expo-session"
  
  private static let origin = "https://exp.host"
  private static let graphQLEndpoint = URL(string: "\(DevMenuExpoApiClient.origin)/--/graphql")
  private static let restEndpoint = URL(string: "\(DevMenuExpoApiClient.origin)/--/api/v2/")
  
  var sessionSecret: String? = nil
    
  func isLoggedIn() -> Bool {
    return sessionSecret != nil
  }
  
  func setSessionSecret(_ sessionSecret: String?) {
    self.sessionSecret = sessionSecret
  }
  
  func queryDevSessionsAsync(_ completionHandler: @escaping HTTPCompletionHandler) {
    fetch(URL(string: "development-sessions", relativeTo: DevMenuExpoApiClient.restEndpoint)!, completionHandler: completionHandler)
  }
  
  private func fetch(_ url: URL, completionHandler: @escaping HTTPCompletionHandler) {
    let session = URLSession.shared
    
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.setValue(sessionSecret, forHTTPHeaderField: DevMenuExpoApiClient.authHeader)
    
    session.dataTask(with: request, completionHandler: completionHandler).resume()
  }
}
