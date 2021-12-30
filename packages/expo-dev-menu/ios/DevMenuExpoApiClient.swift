// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

class DevMenuExpoApiClient: NSObject, DevMenuExpoApiClientProtocol {
  private static let authHeader = "expo-session"

  private static let origin = "https://exp.host"
  private static let graphQLEndpoint = URL(string: "\(DevMenuExpoApiClient.origin)/--/graphql")!
  private static let restEndpoint = URL(string: "\(DevMenuExpoApiClient.origin)/--/api/v2/")!

  var session: URLSession = URLSession.shared
  var sessionSecret: String?

  func isLoggedIn() -> Bool {
    return sessionSecret != nil
  }

  func setSessionSecret(_ sessionSecret: String?) {
    self.sessionSecret = sessionSecret
  }

  func queryDevSessionsAsync(_ installationID: String?, completionHandler: @escaping HTTPCompletionHandler) {
    var url = URL(string: "development-sessions", relativeTo: DevMenuExpoApiClient.restEndpoint)!
    if installationID != nil {
      var urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: true)
      urlComponents?.queryItems = [URLQueryItem(name: "deviceId", value: installationID)]
      url = urlComponents?.url ?? url
    }
    fetch(url, completionHandler: completionHandler)
  }

  func queryUpdateChannels(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Channel]?, URLResponse?, Error?) -> Void,
    options: DevMenuGraphQLOptions
  ) {
    fetchGraphQL(
      DevMenuExpoApiClient.graphQLEndpoint,
      query: """
            {
              app {
                byId(appId: "\(appId)") {
                  updateChannels(offset: \(options.offset), limit: \(options.limit)) {
                    id
                    name
                    createdAt
                    updatedAt
                  }
                }
              }
            }
            """,
      dataPath: ["data", "app", "byId", "updateChannels"],
      completionHandler: completionHandler
    )
  }

  func queryUpdateBranches(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Branch]?, URLResponse?, Error?) -> Void,
    branchesOptions: DevMenuGraphQLOptions,
    updatesOptions: DevMenuGraphQLOptions
  ) {
    fetchGraphQL(
      DevMenuExpoApiClient.graphQLEndpoint,
      query: """
              {
                app {
                  byId(appId: "\(appId)") {
                    updateBranches(offset: \(branchesOptions.offset), limit: \(branchesOptions.limit)) {
                      id
                      updates(offset: \(updatesOptions.offset), limit: \(updatesOptions.limit)) {
                        id
                        runtimeVersion
                        platform
                        message
                        updatedAt
                        createdAt
                      }
                    }
                  }
                }
              }
              """,
      dataPath: ["data", "app", "byId", "updateBranches"],
      completionHandler: completionHandler
    )
  }

  private func fetch(_ url: URL, completionHandler: @escaping HTTPCompletionHandler) {
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    if sessionSecret != nil {
      request.setValue(sessionSecret, forHTTPHeaderField: DevMenuExpoApiClient.authHeader)
    }

    session.dataTask(with: request, completionHandler: completionHandler).resume()
  }

  private func fetchGraphQL<T: DevMenuConstructibleFromDictionary>(
    _ url: URL,
    query: String,
    dataPath: [String],
    completionHandler: @escaping ([T]?, URLResponse?, Error?) -> Void
  ) {
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    if sessionSecret != nil {
      request.setValue(sessionSecret, forHTTPHeaderField: DevMenuExpoApiClient.authHeader)
    }
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    let parsedQuery = "{ \"query\": \"\(query.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "\n", with: "\\n").replacingOccurrences(of: "\"", with: "\\\""))\"}"
    request.httpBody = parsedQuery.data(using: .utf8)

    let rawCompletionHandler = createGraphQLResponseHandler(dataPath: dataPath, completionHandler: completionHandler)
    session.dataTask(with: request, completionHandler: rawCompletionHandler).resume()
  }

  private func createGraphQLResponseHandler<T: DevMenuConstructibleFromDictionary>(
    dataPath: [String],
    completionHandler: @escaping ([T]?, URLResponse?, Error?) -> Void
  ) -> (Data?, URLResponse?, Error?) -> Void {
    return {
      rawData, response, error in
      guard error == nil else {
        completionHandler(nil, response, error)
        return
      }

      guard let rawData = rawData else {
        completionHandler(nil, response, error)
        return
      }

      let parsedData = self.extractInnerJSONObject(
        data: rawData,
        path: dataPath,
        toType: [[String: Any]].self
      ) ?? []
      let output = parsedData.map { T.init(dictionary: $0) }

      completionHandler(output, response, error)
    }
  }

  private func extractInnerJSONObject<T>(data: Data, path: [String], toType: T.Type) -> T? {
    var currentSection = try? JSONSerialization.jsonObject(with: data, options: [])
    for p in path {
      let nextSection = (currentSection as? [String: Any])?[p]
      if nextSection == nil {
        return nil
      }
      currentSection = nextSection
    }
    return currentSection as? T
  }
}
