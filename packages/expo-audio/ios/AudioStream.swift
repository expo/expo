import AVFoundation
import ExpoMediaSession
import ExpoModulesCore

@Record
struct AudioStreamStatusEvent {
  var isStreaming: Bool
}

@Record
struct AudioStreamBufferEvent {
  var data: ArrayBuffer
  var sampleRate: Double
  var channels: Int
  var timestamp: Double
}

@SharedObject
public final class AudioStream: SharedObject, SessionCommandTarget {
  @JS
  let id = UUID().uuidString

  private let requestedSampleRate: Double
  private let requestedChannels: Int
  private let encoding: AudioStreamEncoding

  private var audioEngine: AVAudioEngine?
  private var converter: AVAudioConverter?

  private(set) var sampleRate: Double = 0
  private(set) var channels: Int = 0
  private(set) var isStreaming: Bool = false
  private var startTimestamp: AVAudioTime?

  private var fileWriter: AudioStreamFileWriter?
  private let fileWriterQueue = DispatchQueue(label: "expo.audio.filewrite", qos: .default)
  private var fileWriterError: Error?
  private var startTask: Task<Void, Error>?
  var allowsBackgroundRecording: () -> Bool = { false }
  let sessionUse: SessionUseSlot

  @Event("audioStreamStatus")
  var onAudioStreamStatus: (AudioStreamStatusEvent) -> Void

  @Event("audioStreamBuffer")
  var onAudioStreamBuffer: (AudioStreamBufferEvent) -> Void

  init(options: AudioStreamOptions, session: any MediaSessionManaging = MediaSessionManager.shared) {
    self.requestedSampleRate = options.sampleRate
    self.requestedChannels = options.channels
    self.encoding = options.encoding
    self.sessionUse = SessionUseSlot(session: session, label: "stream")
    super.init()
    sessionUse.client = "expo-audio:stream:\(id)"
    sessionUse.target = self
  }

  @JS
  func start() async throws {
    #if os(iOS)
    try AudioRecordingRequester.requirePermission()
    #endif
    guard !isStreaming else {
      return
    }
    let requirements = SessionRequirements(
      capabilities: .measurement,
      preferredSampleRate: requestedSampleRate,
      continuesInBackground: allowsBackgroundRecording()
    )
    let starting = Task {
      let use = sessionUse.sync {
        sessionUse.begin(requirements)
      }
      do {
        try await use.activated()
        try await sessionUse.queue.perform {
          guard self.sessionUse.isCurrent(use) else {
            throw AudioStreamException("The stream was stopped while it was starting. Call start() again to stream")
          }
          try self.startCapture()
        }
      } catch {
        sessionUse.sync {
          sessionUse.end(ifCurrent: use)
        }
        throw error
      }
    }
    startTask = starting
    try await starting.value
  }

  @JS("sampleRate")
  var sampleRateFromJS: Double {
    sampleRate
  }

  @JS("channels")
  var channelsFromJS: Int {
    channels
  }

  @JS("isStreaming")
  var isStreamingFromJS: Bool {
    isStreaming
  }

  @JS
  func startFileRecordingAsync(_ options: AudioStreamFileRecordingOptions?) async throws -> AudioStreamFileRecordingStartResult {
    _ = try? await startTask?.value
    return try await sessionUse.queue.perform {
      try self.startFileRecording(options)
    }
  }

  private func startFileRecording(_ options: AudioStreamFileRecordingOptions?) throws -> AudioStreamFileRecordingStartResult {
    let opts = options ?? AudioStreamFileRecordingOptions()
    let format = opts.format
    let url: URL
    if let uri = opts.uri {
      guard uri.pathExtension.lowercased() == format.fileExtension else {
        throw AudioStreamFileException(
          "The URI '\(uri.lastPathComponent)' has extension '.\(uri.pathExtension.lowercased())' but the chosen format is '\(format.rawValue)'. Change the URI extension or the format to match."
        )
      }
      url = uri
    } else {
      let baseDir = try AudioUtils.recordingDirectory(for: opts.directory, appContext: appContext)
      let streamDir = baseDir.appendingPathComponent("AudioStream")
      try FileManager.default.createDirectory(at: streamDir, withIntermediateDirectories: true)
      url = streamDir.appendingPathComponent("stream-\(UUID().uuidString).\(format.fileExtension)")
    }
    let resolvedUri = try startFileRecording(url: url, format: format)
    return AudioStreamFileRecordingStartResult(uri: resolvedUri)
  }

  @JS
  func stopFileRecordingAsync() async throws -> AudioStreamFileRecordingResult {
    try await sessionUse.queue.perform {
      try self.stopFileRecording()
    }
  }

  private func startCapture() throws {
    guard !isStreaming else { return }

    let engine = AVAudioEngine()
    let inputNode = engine.inputNode
    let hardwareFormat = inputNode.outputFormat(forBus: 0)

    let targetSampleRate = requestedSampleRate
    let targetChannels = AVAudioChannelCount(requestedChannels)

    let isInt16 = encoding == .int16
    let commonFormat: AVAudioCommonFormat = isInt16 ? .pcmFormatInt16 : .pcmFormatFloat32
    guard let targetFormat = AVAudioFormat(
      commonFormat: commonFormat,
      sampleRate: targetSampleRate,
      channels: targetChannels,
      interleaved: true
    ) else {
      throw AudioStreamException(
        "The audio format (\(Int(targetSampleRate)) Hz, \(Int(targetChannels)) ch, \(encoding.rawValue)) is not supported by this device. "
        + "Try a different sample rate (48000, 44100, or 16000) or reduce the channel count to 1."
      )
    }

    self.converter = try AudioStream.makeConverter(from: hardwareFormat, to: targetFormat)

    sampleRate = targetSampleRate
    channels = Int(targetChannels)

    let bufferSize = AVAudioFrameCount(targetSampleRate * 0.1)

    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: hardwareFormat) {
      [weak self] (buffer, when) in
      guard let self else { return }

      if self.startTimestamp == nil {
        self.startTimestamp = when
      }

      if let converter = self.converter {
        self.convertAndEmit(inputBuffer: buffer, converter: converter, targetFormat: targetFormat, when: when)
      } else {
        self.emitBuffer(buffer: buffer, when: when)
      }
    }

    self.audioEngine = engine
    try startEngine(engine)
    isStreaming = true
    emitStatus()
  }

  // Starting the engine happens after the tap is installed. If it fails, undo the setup here: a later
  // stop() cannot, because it returns early while isStreaming is still false.
  private func startEngine(_ engine: AVAudioEngine) throws {
    do {
      try engine.start()
    } catch {
      engine.inputNode.removeTap(onBus: 0)
      engine.stop()
      audioEngine = nil
      converter = nil
      throw error
    }
  }

  @JS
  nonisolated func stop() {
    sessionUse.sync {
      stopCapture()
      sessionUse.end()
    }
  }

  private func stopCapture() {
    guard isStreaming else { return }
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    audioEngine = nil
    converter = nil
    isStreaming = false
    startTimestamp = nil
    emitStatus()

    // Auto-finalize any in-progress file recording.
    // removeTap above ensures no more data is dispatched to fileWriterQueue;
    // syncing on the queue drains any appends already in flight before closing the writer.
    fileWriterQueue.sync {
      _ = try? self.fileWriter?.finish()
      self.fileWriter = nil
      self.fileWriterError = nil
    }
  }

  func startFileRecording(url: URL, format: AudioStreamFileFormat) throws -> String {
    guard fileWriter == nil else {
      throw AudioStreamFileException(
        "A file recording is already in progress. Each stream supports one file recording at a time. Call stopFileRecordingAsync() before starting another."
      )
    }
    guard isStreaming else {
      throw AudioStreamFileException(
        "The stream must be running to start file recording. Call start() before startFileRecordingAsync()."
      )
    }
    fileWriterError = nil
    fileWriter = try AudioStreamFileWriter(url: url, format: format, sampleRate: sampleRate, channels: channels, encoding: encoding)
    return url.absoluteString
  }

  func stopFileRecording() throws -> AudioStreamFileRecordingResult {
    guard let writer = fileWriter else {
      throw AudioStreamFileException(
        "No file recording is in progress. Call startFileRecordingAsync() before stopFileRecordingAsync()."
      )
    }
    // 1. Nil out fileWriter on the serial queue so the tap callback stops dispatching new appends,
    //    and capture any pending write error.
    var appendError: Error?
    fileWriterQueue.sync {
      appendError = fileWriterError
      fileWriterError = nil
      fileWriter = nil
    }
    // 2. Drain any appends dispatched while fileWriter was still non-nil during the sync above.
    //    After this second sync returns, no further appends can run on writer, so finish() is safe.
    fileWriterQueue.sync {}
    if let appendError {
      throw appendError
    }
    let (totalSize, frames) = try writer.finish()
    return AudioStreamFileRecordingResult(
      uri: writer.url.absoluteString,
      duration: sampleRate > 0 ? Double(frames) / sampleRate : 0,
      size: Int(totalSize),
      sampleRate: Int(sampleRate),
      channels: channels,
      encoding: encoding
    )
  }

  static func makeConverter(from inputFormat: AVAudioFormat, to targetFormat: AVAudioFormat) throws -> AVAudioConverter? {
    if inputFormat == targetFormat {
      return nil
    }
    guard let converter = AVAudioConverter(from: inputFormat, to: targetFormat) else {
      throw AudioStreamException(
        "The audio input (\(describe(inputFormat))) cannot be converted to the requested format (\(describe(targetFormat))). "
        + "Check that a microphone is connected, or request a different sample rate or channel count"
      )
    }
    return converter
  }

  private static func describe(_ format: AVAudioFormat) -> String {
    let sampleType: String
    switch format.commonFormat {
    case .pcmFormatInt16: sampleType = "Int16"
    case .pcmFormatInt32: sampleType = "Int32"
    case .pcmFormatFloat32: sampleType = "Float32"
    case .pcmFormatFloat64: sampleType = "Float64"
    default: sampleType = "unknown sample type"
    }
    return "\(Int(format.sampleRate)) Hz, \(format.channelCount) ch, \(sampleType)"
  }

  private func convertAndEmit(
    inputBuffer: AVAudioPCMBuffer,
    converter: AVAudioConverter,
    targetFormat: AVAudioFormat,
    when: AVAudioTime
  ) {
    let frameCapacity = AVAudioFrameCount(
      Double(inputBuffer.frameLength) * targetFormat.sampleRate / inputBuffer.format.sampleRate
    ) + 1
    guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: frameCapacity) else {
      return
    }

    var error: NSError?
    var inputConsumed = false
    converter.convert(to: outputBuffer, error: &error) { _, outStatus in
      if inputConsumed {
        outStatus.pointee = .noDataNow
        return nil
      }
      inputConsumed = true
      outStatus.pointee = .haveData
      return inputBuffer
    }

    if error == nil && outputBuffer.frameLength > 0 {
      emitBuffer(buffer: outputBuffer, when: when)
    }
  }

  private func emitStatus() {
    onAudioStreamStatus(AudioStreamStatusEvent(isStreaming: isStreaming))
  }

  private func emitBuffer(buffer: AVAudioPCMBuffer, when: AVAudioTime) {
    let frameLength = Int(buffer.frameLength)
    guard frameLength > 0 else { return }

    // Write to file if recording — extract bytes on audio thread, write on fileWriterQueue
    if let writer = fileWriter {
      let channelCount = Int(buffer.format.channelCount)
      var pcmData: Data?
      if encoding == .int16, let int16Data = buffer.int16ChannelData {
        let byteCount = frameLength * channelCount * MemoryLayout<Int16>.size
        pcmData = Data(bytes: int16Data[0], count: byteCount)
      } else if let floatData = buffer.floatChannelData {
        let byteCount = frameLength * channelCount * MemoryLayout<Float32>.size
        pcmData = Data(bytes: floatData[0], count: byteCount)
      }
      if let data = pcmData {
        fileWriterQueue.async { [weak self, weak writer] in
          guard let writer else { return }
          do {
            try writer.append(pcmData: data)
          } catch {
            guard let self else { return }
            self.fileWriterError = error
          }
        }
      }
    }

    let timestamp = timestampSinceStart(when)
    let channelCount = Int(buffer.format.channelCount)
    let data: ArrayBuffer
    let sampleCount = frameLength * channelCount

    if encoding == .int16, let int16Data = buffer.int16ChannelData {
      let byteCount = sampleCount * MemoryLayout<Int16>.size
      data = ArrayBuffer.copy(of: int16Data[0], count: byteCount)
    } else if let floatData = buffer.floatChannelData {
      let byteCount = sampleCount * MemoryLayout<Float32>.size
      data = ArrayBuffer.copy(of: floatData[0], count: byteCount)
    } else {
      return
    }

    onAudioStreamBuffer(AudioStreamBufferEvent(
      data: data,
      sampleRate: sampleRate,
      channels: channels,
      timestamp: timestamp
    ))
  }

  private func timestampSinceStart(_ when: AVAudioTime) -> Double {
    guard let startTimestamp, when.isHostTimeValid, startTimestamp.isHostTimeValid else { return 0 }
    return AVAudioTime.seconds(forHostTime: when.hostTime) - AVAudioTime.seconds(forHostTime: startTimestamp.hostTime)
  }

  // Deinit can run on the session use queue, so it must not call stop().
  deinit {
    stopCapture()
    sessionUse.queue.async { [sessionUse] in
      sessionUse.end()
    }
  }

  func sessionPause(reason: SessionPauseReason) {
    audioEngine?.pause()
  }

  func sessionResume() {
    try? audioEngine?.start()
  }

  func sessionDuck(_ isDucked: Bool) {}

  func sessionDidFail(_ error: Error) {
    stopCapture()
  }

  func sessionDidEnd() {
    stopCapture()
  }
}

internal final class AudioStreamException: GenericException<String> {
  override var reason: String {
    param
  }
}
