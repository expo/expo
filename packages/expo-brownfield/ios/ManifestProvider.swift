#if DEBUG && canImport(EXDevMenu) && canImport(EXManifests)
  internal import EXDevMenu
  internal import EXManifests
#endif

public class ManifestProvider {
  public static func setupDevMenuManifest(bundleURL: URL?) {
    #if DEBUG && canImport(EXDevMenu) && canImport(EXManifests)
      guard let bundleURL else {
        print("⚠️ Bundle URL couldn't be retrieved")
        return
      }

      guard let scheme = bundleURL.scheme,
        let host = bundleURL.host,
        let port = bundleURL.port
      else {
        print("⚠️ Metro server URL couldn't be retrieved from bundle URL")
        return
      }

      guard let manifestURL = URL(string: "\(scheme)://\(host):\(port)") else {
        print("⚠️ Manifest URL couldn't be created")
        return
      }

      var request = URLRequest(url: manifestURL)
      request.setValue("ios", forHTTPHeaderField: "expo-platform")
      request.setValue("application/expo+json,application/json", forHTTPHeaderField: "accept")
      request.timeoutInterval = 10.0

      print("📡 Fetching manifest for dev-menu from: \(manifestURL.absoluteString)")

      let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
        if let error = error {
          print("❌ Error fetching manifest: \(error.localizedDescription)")
          return
        }

        guard let data = data,
          let httpResponse = response as? HTTPURLResponse,
          (200..<300).contains(httpResponse.statusCode)
        else {
          let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
          print("⚠️ Invalid response when fetching manifest (status: \(statusCode))")
          return
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
          print("⚠️ Could not parse manifest JSON")
          return
        }

        print("✅ Successfully fetched manifest")
        let manifest = ManifestFactory.manifest(forManifestJSON: json)
        DevMenuManager.shared.updateCurrentManifest(manifest, manifestURL: manifestURL)
      }

      task.resume()
    #else
      return
    #endif
  }
}
