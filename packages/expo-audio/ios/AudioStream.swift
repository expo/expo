import AVFoundation
import ExpoModulesCore

private let AUDIO_STREAM_BUFFER = "audioStreamBuffer"
private let AUDIO_STREAM_STATUS = "audioStreamStatus"

class AudioStream: SharedObject {
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

  init(options: AudioStreamOptions) {
    self.requestedSampleRate = options.sampleRate
    self.requestedChannels = options.channels
    self.encoding = options.encoding
    super.init()
  }

  func start() throws {
    guard !isStreaming else { return }

    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement)
    try session.setPreferredSampleRate(requestedSampleRate)
    try session.setActive(true)

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

    let needsConversion = hardwareFormat.sampleRate != targetSampleRate
      || hardwareFormat.channelCount != targetChannels
      || hardwareFormat.commonFormat != commonFormat

    if needsConversion {
      guard let conv = AVAudioConverter(from: hardwareFormat, to: targetFormat) else {
        sampleRate = hardwareFormat.sampleRate
        channels = Int(hardwareFormat.channelCount)
        setupTapWithoutConversion(engine: engine, inputNode: inputNode, format: hardwareFormat)
        self.audioEngine = engine
        try engine.start()
        isStreaming = true
        emitStatus()
        return
      }
      self.converter = conv
    }

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
    try engine.start()
    isStreaming = true
    emitStatus()
  }

  func stop() {
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
      try? self.fileWriter?.finish()
      self.fileWriter = nil
      self.fileWriterError = nil
    }

    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
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

  private func setupTapWithoutConversion(engine: AVAudioEngine, inputNode: AVAudioInputNode, format: AVAudioFormat) {
    let bufferSize = AVAudioFrameCount(format.sampleRate * 0.1)
    inputNode.installTap(onBus: 0, bufferSize: bufferSize, format: format) {
      [weak self] (buffer, when) in
      guard let self else { return }
      if self.startTimestamp == nil {
        self.startTimestamp = when
      }
      self.emitBuffer(buffer: buffer, when: when)
    }
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
    emit(event: AUDIO_STREAM_STATUS, payload: [
      "isStreaming": isStreaming
    ])
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
    let data: NativeArrayBuffer

    if encoding == .int16, let int16Data = buffer.int16ChannelData {
      let sampleCount = frameLength * channelCount
      let byteCount = sampleCount * MemoryLayout<Int16>.size
      data = NativeArrayBuffer.copy(of: int16Data[0], count: byteCount)
    } else if let floatData = buffer.floatChannelData {
      let sampleCount = frameLength * channelCount
      let byteCount = sampleCount * MemoryLayout<Float32>.size
      data = NativeArrayBuffer.copy(of: floatData[0], count: byteCount)
    } else {
      return
    }

    emit(event: AUDIO_STREAM_BUFFER, payload: [
      "data": data,
      "sampleRate": sampleRate,
      "channels": channels,
      "timestamp": timestamp
    ])
  }

  private func timestampSinceStart(_ when: AVAudioTime) -> Double {
    guard let startTimestamp else { return 0 }
    let hostTimeDiff = when.hostTime - startTimestamp.hostTime
    return Double(hostTimeDiff) / Double(NSEC_PER_SEC)
  }

  deinit {
    stop()
  }
}

internal final class AudioStreamException: GenericException<String> {
  override var reason: String {
    param
  }
}
