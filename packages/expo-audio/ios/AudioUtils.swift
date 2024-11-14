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
  static func createRecorder(directory: URL?, with options: RecordingOptions) -> AVAudioRecorder {
    if let directory {
      let fileUrl = createRecordingUrl(from: directory, with: options)
      do {
        return try AVAudioRecorder(url: fileUrl, settings: AudioUtils.createRecordingOptions(options))
      } catch {
        return AVAudioRecorder()
      }
    }
    return AVAudioRecorder()
  }

  static func createAVPlayer(source: AudioSource?) -> AVPlayer {
    if let source, let url = source.uri {
      let asset = AVURLAsset(url: url, options: source.headers)
      let item = AVPlayerItem(asset: asset)
      return AVPlayer(playerItem: item)
    }
    return AVPlayer()
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

  private static func createRecordingUrl(from dir: URL, with options: RecordingOptions) -> URL {
    let directoryPath = dir.appendingPathComponent("ExpoAudio")
    FileSystemUtilities.ensureDirExists(at: directoryPath)
    let fileName = "recording-\(UUID().uuidString)\(options.extension)"
    return directoryPath.appendingPathComponent(fileName)
  }

  private static func getFormatIDFromString(typeString: String) -> UInt32? {
    if let s = (typeString as NSString).utf8String {
      return UInt32(s[3]) | (UInt32(s[2]) << 8) | (UInt32(s[1]) << 16) | (UInt32(s[0]) << 24)
    }
    return nil
  }

  static func validateAudioMode(mode: AudioMode) throws {
    if !mode.playsInSilentMode && mode.interruptionMode == .duckOthers {
      throw InvalidAudioModeException("playsInSilentMode == false and duckOthers == true cannot be set on iOS")
    } else if !mode.playsInSilentMode && mode.allowsRecording {
      throw InvalidAudioModeException("playsInSilentMode == false and duckOthers == true cannot be set on iOS")
    } else if !mode.playsInSilentMode && mode.shouldPlayInBackground {
      throw InvalidAudioModeException("playsInSilentMode == false and staysActiveInBackground == true cannot be set on iOS.")
    }
  }
}
