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

    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
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
    emit(event: AUDIO_STREAM_STATUS, arguments: [
      "isStreaming": isStreaming
    ])
  }

  private func emitBuffer(buffer: AVAudioPCMBuffer, when: AVAudioTime) {
    let frameLength = Int(buffer.frameLength)
    guard frameLength > 0 else { return }

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

    emit(event: AUDIO_STREAM_BUFFER, arguments: [
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
