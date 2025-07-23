import AVFoundation
import ExpoModulesCore

struct RecordingUtils {
  static func getAvailableInputs() -> [[String: Any]] {
    var inputs = [[String: Any]]()
    if let availableInputs = AVAudioSession.sharedInstance().availableInputs {
      for desc in availableInputs {
        inputs.append([
          "name": desc.portName,
          "type": desc.portType,
          "uid": desc.uid
        ])
      }
    }

    return inputs
  }

  static func getCurrentInput() throws -> [String: Any] {
    guard let desc = try? getActiveInput() else {
      throw NoInputFoundException()
    }

    return [
      "name": desc.portName,
      "type": desc.portType.rawValue,
      "uid": desc.uid
    ]
  }

  static func setInput(_ input: String) throws {
    var prefferedInput: AVAudioSessionPortDescription?
    if let currentInputs = AVAudioSession.sharedInstance().availableInputs {
      for desc in currentInputs where desc.uid == input {
        prefferedInput = desc
      }
    }

    guard let prefferedInput else {
      throw PreferredInputFoundException(input)
    }

    try AVAudioSession.sharedInstance().setPreferredInput(prefferedInput)
  }

  static func getActiveInput() throws -> AVAudioSessionPortDescription? {
    let currentRoute = AVAudioSession.sharedInstance().currentRoute
    let inputs = currentRoute.inputs

    if !inputs.isEmpty {
      return inputs.first
    }

    if let preferredInput = AVAudioSession.sharedInstance().preferredInput {
      return preferredInput
    }

    if let availableInputs = AVAudioSession.sharedInstance().availableInputs {
      if !availableInputs.isEmpty {
        let defaultInput = availableInputs.first
        try AVAudioSession.sharedInstance().setPreferredInput(defaultInput)
        return defaultInput
      }
    }

    return nil
  }
}

struct AudioUtils {
  #if os(iOS)
  static func createRecorder(directory: URL?, with options: RecordingOptions) -> AVAudioRecorder {
    if let directory {
      let fileUrl = createRecordingUrl(from: directory, with: options)
      do {
        let recorder = try AVAudioRecorder(url: fileUrl, settings: AudioUtils.createRecordingOptions(options))
        recorder.isMeteringEnabled = options.isMeteringEnabled
        return recorder
      } catch {
        return AVAudioRecorder()
      }
    }
    return AVAudioRecorder()
  }
  #endif

  static func createAVPlayer(from source: AudioSource?) -> AVPlayer {
    if let source, let url = source.uri {
      let finalUrl = if url.isBase64Audio {
        handleBase64Asset(base64String: url.absoluteString) ?? url
      } else {
        url
      }

      var options: [String: Any]?
      if let headers = source.headers {
        options = ["AVURLAssetHTTPHeaderFieldsKey": headers]
      }

      let asset = AVURLAsset(url: finalUrl, options: options)
      let item = AVPlayerItem(asset: asset)
      return AVPlayer(playerItem: item)
    }
    return AVPlayer()
  }

  static func createAVPlayerItem(from source: AudioSource?) -> AVPlayerItem? {
    guard let source, let url = source.uri else {
      return nil
    }
    let finalUrl = if url.isBase64Audio {
      handleBase64Asset(base64String: url.absoluteString) ?? url
    } else {
      url
    }

    var options: [String: Any]?
    if let headers = source.headers {
      options = ["AVURLAssetHTTPHeaderFieldsKey": headers]
    }

    let asset = AVURLAsset(url: finalUrl, options: options)
    return AVPlayerItem(asset: asset)
  }

  static func createRecordingOptions(_ options: RecordingOptions) -> [String: Any] {
    let strategy = options.bitRateStrategy?.toAVBitRateStrategy() ?? AVAudioBitRateStrategy_Variable

    var settings = [String: Any]()

    if strategy == AVAudioBitRateStrategy_Variable {
      settings[AVEncoderAudioQualityForVBRKey] = strategy
    } else {
      settings[AVEncoderAudioQualityKey] = strategy
    }
    settings[AVSampleRateKey] = options.sampleRate
    settings[AVNumberOfChannelsKey] = options.numberOfChannels
    settings[AVEncoderBitRateKey] = options.bitRate

    if let bitDepthHint = options.bitDepthHint {
      settings[AVEncoderBitDepthHintKey] = bitDepthHint
    }
    if let linearPCMBitDepth = options.linearPCMBitDepth {
      settings[AVLinearPCMBitDepthKey] = linearPCMBitDepth
    }
    if let linearPCMIsBigEndian = options.linearPCMIsBigEndian {
      settings[AVLinearPCMIsBigEndianKey] = linearPCMIsBigEndian
    }
    if let linearPCMIsFloat = options.linearPCMIsFloat {
      settings[AVLinearPCMIsFloatKey] = linearPCMIsFloat
    }
    if let formatKey = options.outputFormat {
      settings[AVFormatIDKey] = getFormatIDFromString(typeString: formatKey)
    }

    return settings
  }

  private static func handleBase64Asset(base64String: String) -> URL? {
    let components = base64String.components(separatedBy: ",")
    guard components.count == 2 else {
      return nil
    }
    let mimeType = components[0].components(separatedBy: ";")[0].components(separatedBy: ":")[1]
    let base64Data = components[1]

    guard let data = Data(base64Encoded: base64Data, options: .ignoreUnknownCharacters) else {
      return nil
    }

    let fileExtension = getFileExtension(for: mimeType)
    let tempDirectory = FileManager.default.temporaryDirectory
    let fileName = UUID().uuidString + "." + fileExtension
    let fileURL = tempDirectory.appendingPathComponent(fileName)

    do {
      try data.write(to: fileURL)
      return fileURL
    } catch {
      return nil
    }
  }

  static func getFileExtension(for mimeType: String) -> String {
    if let utType = UTType(mimeType: mimeType) {
      return utType.preferredFilenameExtension ?? "dat"
    }
    return "dat"
  }

  private static func createRecordingUrl(from dir: URL, with options: RecordingOptions) -> URL {
    let directoryPath = dir.appendingPathComponent("ExpoAudio")
    FileSystemUtilities.ensureDirExists(at: directoryPath)
    let fileName = "recording-\(UUID().uuidString)\(options.extension)"
    return directoryPath.appendingPathComponent(fileName)
  }

  private static func getFormatIDFromString(typeString: String) -> UInt32? {
    // swiftlint:disable:next legacy_objc_type
    if let s = (typeString as NSString).utf8String {
      return UInt32(s[3]) | (UInt32(s[2]) << 8) | (UInt32(s[1]) << 16) | (UInt32(s[0]) << 24)
    }
    return nil
  }

  static func validateAudioMode(mode: AudioMode) throws {
    if !mode.playsInSilentMode && mode.interruptionMode == .duckOthers {
      throw InvalidAudioModeException("playsInSilentMode == false and duckOthers == true cannot be set on iOS")
    }
    if !mode.playsInSilentMode && mode.allowsRecording {
      throw InvalidAudioModeException("playsInSilentMode == false and allowsRecording == true cannot be set on iOS")
    }
    if !mode.playsInSilentMode && mode.shouldPlayInBackground {
      throw InvalidAudioModeException("playsInSilentMode == false and staysActiveInBackground == true cannot be set on iOS.")
    }
  }
}

private extension URL {
  var isBase64Audio: Bool {
    return absoluteString.hasPrefix("data:audio/")
  }
}
