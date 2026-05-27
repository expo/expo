import ExpoModulesCore

public class ManifestProvider {
  /**
  * Fetches the manifest for brownfield setup
  */
  public static func fetchManifest(
    bundleURL: URL?,
    completion: @escaping ([String: Any]?, URL?) -> Void
  ) {
    #if DEBUG
      guard let manifestURL = resolveManifestURL(bundleURL) else {
        completion(nil, nil)
        return
      }

      var request = URLRequest(url: manifestURL)
      request.setValue("ios", forHTTPHeaderField: "expo-platform")
      request.setValue("application/expo+json,application/json", forHTTPHeaderField: "accept")
      request.timeoutInterval = 10.0

      print("📡 Fetching manifest for dev-menu from: \(manifestURL.absoluteString)")

      let task = URLSession.shared.dataTask(with: ExpoNetworkConfiguration.modifiedRequest(request)) { data, response, error in
        if let error = error {
          print("❌ Error fetching manifest: \(error.localizedDescription)")
          completion(nil, nil)
          return
        }

        guard let data = data,
          let httpResponse = response as? HTTPURLResponse,
          (200..<300).contains(httpResponse.statusCode)
        else {
          let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
          print("⚠️ Invalid response when fetching manifest (status: \(statusCode))")
          completion(nil, nil)
          return
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
          print("⚠️ Could not parse manifest JSON")
          completion(nil, nil)
          return
        }

        print("✅ Successfully fetched manifest")
        completion(json, manifestURL)
      }

      task.resume()
    #else
      completion(nil, nil)
    #endif
  }

  private static func resolveManifestURL(_ bundleURL: URL?) -> URL? {
    guard let bundleURL else {
      print("⚠️ Bundle URL couldn't be retrieved")
      return nil
    }

    guard let scheme = bundleURL.scheme,
      let host = bundleURL.host,
      let port = bundleURL.port
    else {
      print("⚠️ Metro server URL couldn't be retrieved from bundle URL")
      return nil
    }

    guard let manifestURL = URL(string: "\(scheme)://\(host):\(port)") else {
      print("⚠️ Manifest URL couldn't be created")
      return nil
    }

    return manifestURL
  }
}
