import ExpoModulesCore
import EASClient

/**
 Indicates whether the app launch event has already been sent.
 */
private var wasAppLaunchEventDispatched = false

public final class InsightsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoInsights")

    OnCreate {
      DispatchQueue.main.async {
        // The app launch event should be sent only during the first launch
        // which means that we need to prevent dispatching them on app reload.
        if !wasAppLaunchEventDispatched {
          wasAppLaunchEventDispatched = true

          Task {
            try await self.dispatchLaunchEvent()
          }
        }
      }
    }
  }

  /**
   Sends the `APP_LAUNCH` event.
   */
  private func dispatchLaunchEvent() async throws {
    guard let manifest = appContext?.constants?.constants()["manifest"] as? [String: Any] else {
      log.warn("Insights: Unable to read the manifest")
      return
    }
    guard let projectId = getProjectId(manifest: manifest) else {
      log.warn("Insights: Unable to get the project ID")
      return
    }
    let data = getLaunchEventData(projectId: projectId)
    try await dispatchEvent(projectId: projectId, eventName: "APP_LAUNCH", data: data)
  }

  /**
   Sends an event with the given name and data.
   */
  private func dispatchEvent(projectId: String, eventName: String, data: [String: String?]) async throws {
    let endpointUrl = "https://i.expo.dev/v1/c/\(projectId)"

    guard var urlComponents = URLComponents(string: endpointUrl) else {
      log.warn("Insights: The URL for the HTTP endpoint is invalid: \(endpointUrl)")
      return
    }
    var queryItems: [URLQueryItem] = []

    for (key, value) in data {
      queryItems.append(
        URLQueryItem(name: key, value: value)
      )
    }

    urlComponents.queryItems = queryItems

    guard let url = urlComponents.url else {
      log.warn("Insights: Cannot create an URL instance from the given query: \(urlComponents.query ?? "Null query")")
      return
    }
    var request = URLRequest(url: url)

    request.httpMethod = "GET"

    let (_, response) = try await URLSession.shared.data(for: request)

    guard let response = response as? HTTPURLResponse else {
      log.warn("Insights: Unexpectedly the response is not of HTTPURLResponse type")
      return
    }
    guard (200...299).contains(response.statusCode) else {
      log.warn("Insights: Server responded with status code \(response.statusCode) for event \(eventName)")
      return
    }
  }

  /**
   Gets the project ID from the manifest.
   */
  private func getProjectId(manifest: [String: Any]) -> String? {
    let extra = manifest["extra"] as? [String: Any]
    let eas = extra?["eas"] as? [String: Any]

    return eas?["projectId"] as? String
  }

  /**
   Returns the data necessary for `APP_LAUNCH` event.
   */
  private func getLaunchEventData(projectId: String) -> [String: String?] {
    let info = Bundle.main.infoDictionary

    return [
      "event_name": "APP_LAUNCH",
      "eas_client_id": EASClientID.uuid().uuidString,
      "project_id": projectId,
      "app_version": info?["CFBundleShortVersionString"] as? String,
      "platform": "iOS",
      "os_version": UIDevice.current.systemVersion
    ]
  }
}
