import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers
import AVFoundation

class ShareIntoViewController: SLComposeServiceViewController {
  // Only the following two properties cause a hard-crash of the share extension, because the failure originates from
  // plugin misconfiguration. Other errors should be handled in the view controller and preferrably print a message, because it
  // is not possible for our users to handle them at runtime.
  private var hostAppScheme: String {
    guard let _hostAppScheme = Bundle.main.object(forInfoDictionaryKey: "MainTargetUrlScheme") as? String else {
      fatalError("Expo-sharing has failed to to load the app scheme from `Info.plist`. Make sure the `expo-sharing` config plugin is configured correctly.")
    }
    return _hostAppScheme
  }

  private var appGroupId: String {
    guard let _appGroupId = Bundle.main.object(forInfoDictionaryKey: "AppGroupId") as? String else {
      fatalError("Expo-sharing has failed to load the app group ID from `Info.plist`. Make sure the `expo-sharing` config plugin is configured correctly.")
    }
    return _appGroupId
  }

  // MARK: - Lifecycle

  override func didSelectPost() {
    // This is called if the standard Apple UI "Post" button is pressed.
    // Since we are redirecting immediately in viewWillAppear, should never be reached,
    // but good to have.
    handleShare()
  }

  override func viewWillAppear(_ animated: Bool) {
    // Immediately start processing when view appears
    handleShare()
    super.viewWillAppear(animated)
  }

  // MARK: - Core Logic

  private func handleShare() {
    guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
      self.extensionContext?.completeRequest(returningItems: nil)
      return
    }

    Task {
      let payload = await Task.detached(priority: .userInitiated) {
        return await self.processInputItems(items)
      }.value

      if !payload.isEmpty {
        saveToUserDefaults(payload)
        openParentApp()
      } else {
        self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
      }
    }
  }

  nonisolated private func processInputItems(_ items: [NSExtensionItem]) async -> [SharePayload] {
    var results: [SharePayload] = []

    for item in items {
      guard let attachments = item.attachments else { continue }

      for provider in attachments {
        if let payload = await parseProvider(provider) {
          results.append(payload)
        }
      }
    }

    return results
  }

  private func saveToUserDefaults(_ payload: [SharePayload]) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      print("Error: Expo-sharing could not initialize UserDefaults with group: \(appGroupId)")
      return
    }

    if let encoded = try? JSONEncoder().encode(payload) {
      userDefaults.set(encoded, forKey: SHARE_INTO_DEFAULTS_KEY)
      userDefaults.synchronize()
    } else {
      print("Error: Expo-sharing has failed to serialize shared data to JSON")
    }
  }

  // MARK: - Provider Parsing

  private func parseProvider(_ provider: NSItemProvider) async -> SharePayload? {
    if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) &&
    !provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
      return await handleWebURL(provider)
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.audio.identifier) {
      return await handleFile(provider, type: .audio, utType: .audio)
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.movie.identifier) {
      return await handleFile(provider, type: .video, utType: .movie)
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
      return await handleFile(provider, type: .image, utType: .image)
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) ||
    provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) {
      return await handleFile(provider, type: .file, utType: .data)
    }

    if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
      return await handleText(provider)
    }

    return nil
  }

  // MARK: - Handlers

  private func handleText(_ provider: NSItemProvider) async -> SharePayload? {
    return await withCheckedContinuation { continuation in
      provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { item, _ in
        guard let text = item as? String else {
          continuation.resume(returning: nil)
          return
        }

        let payload = SharePayload(
          type: .text,
          value: text,
          mimeType: "text/plain",
          metadata: nil
        )
        continuation.resume(returning: payload)
      }
    }
  }

  private func handleWebURL(_ provider: NSItemProvider) async -> SharePayload? {
    return await withCheckedContinuation { continuation in
      provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { item, _ in
        guard let url = item as? URL else {
          continuation.resume(returning: nil)
          return
        }

        let payload = SharePayload(
          type: .url,
          value: url.absoluteString,
          mimeType: "text/html",
          metadata: nil
        )
        continuation.resume(returning: payload)
      }
    }
  }

  private func handleFile(_ provider: NSItemProvider, type: ShareType, utType: UTType) async -> SharePayload? {
    return await withCheckedContinuation { continuation in
      let identifier = provider.registeredTypeIdentifiers.first { providerIdentifier in
        UTType(providerIdentifier)?.conforms(to: utType) ?? false
      } ?? utType.identifier

      provider.loadItem(forTypeIdentifier: identifier, options: nil) { item, _ in
        if let url = item as? URL {
          let result = self.copyAndProcessFile(url: url, type: type)
          continuation.resume(returning: result)
          return
        }

        if let data = item as? Data {
          let fileName = UUID().randomFilename(forTypeIdentifier: identifier)
          let result = self.saveDataToAppGroup(
            data: data,
            fileName: fileName,
            type: type,
            mimeType: UTType(identifier)?.preferredMIMEType
          )
          continuation.resume(returning: result)
          return
        }

        if type == .image, let image = item as? UIImage, let data = image.pngData() {
          let fileName = UUID().uuidString + ".png"
          let result = self.saveDataToAppGroup(data: data, fileName: fileName, type: .image, mimeType: "image/png")
          continuation.resume(returning: result)
          return
        }

        continuation.resume(returning: nil)
      }
    }
  }

  // MARK: - File Management

  private func copyAndProcessFile(url: URL, type: ShareType) -> SharePayload? {
    guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
      return nil
    }

    let fileName = url.lastPathComponent.isEmpty ? UUID().uuidString : url.lastPathComponent
    let destinationURL = containerURL.appendingPathComponent(fileName)

    do {
      if FileManager.default.fileExists(atPath: destinationURL.path) {
        try FileManager.default.removeItem(at: destinationURL)
      }
      try FileManager.default.copyItem(at: url, to: destinationURL)
    } catch {
      print("Error copying file: \(error)")
      return nil
    }

    let size = try? FileManager.default.attributesOfItem(atPath: destinationURL.path)[.size] as? Int
    let fileExt = destinationURL.pathExtension
    let mimeType = UTType(filenameExtension: fileExt)?.preferredMIMEType ?? "application/octet-stream"

    let metadata = ShareMetadata(
      originalName: fileName,
      size: size
    )

    return SharePayload(
      type: type,
      value: destinationURL.absoluteString,
      mimeType: mimeType,
      metadata: metadata
    )
  }

  private func saveDataToAppGroup(data: Data, fileName: String, type: ShareType, mimeType: String?) -> SharePayload? {
    guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
      return nil
    }
    let destinationURL = containerURL.appendingPathComponent(fileName)

    do {
      try data.write(to: destinationURL)
    } catch {
      return nil
    }

    return SharePayload(
      type: type,
      value: destinationURL.absoluteString,
      mimeType: mimeType ?? "application/octet-stream",
      metadata: ShareMetadata(originalName: fileName, size: data.count)
    )
  }

  // MARK: - Open main app

  @MainActor
  func openParentApp() {
    guard let url = URL(string: "\(hostAppScheme)://expo-sharing") else {
      fatalError("The app scheme \(hostAppScheme) is invalid - it is not possible to create a valid deep link URL with it")
    }

    openURL(url)
    self.close()
  }

  // This is a hack that allows us to open the main app target from a share-extension target. Technically this is really
  // discouraged by apple, but I've found that multiple apps exist that use this method and pass the App Store review.
  // We should mention this as a possible future issue in the docs.
  private func openURL(_ url: URL) {
    var responder: UIResponder? = self
    while responder != nil {
      if let application = responder as? UIApplication {
        application.open(url, options: [:], completionHandler: nil)
      }
      responder = responder?.next
    }
  }

  private func close() {
    self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
  }
}

private extension UUID {
  func randomFilename(forTypeIdentifier identifier: String) -> String {
    var ext = ""
    if let preferredExtension = UTType(identifier)?.preferredFilenameExtension {
      ext = ".\(preferredExtension)"
    }
    return UUID().uuidString + ext
  }
}
