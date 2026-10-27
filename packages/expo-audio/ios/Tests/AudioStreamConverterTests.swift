import Testing
import AVFoundation

@testable import ExpoAudio

@Suite("AudioStream.makeConverter")
struct AudioStreamConverterTests {
  @Test
  func `interleaves planar stereo input`() throws {
    let input = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!
    let target = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 48000, channels: 2, interleaved: true)!

    let converter = try #require(try AudioStream.makeConverter(from: input, to: target))

    let inputBuffer = AVAudioPCMBuffer(pcmFormat: input, frameCapacity: 2)!
    inputBuffer.frameLength = 2
    inputBuffer.floatChannelData![0][0] = 1
    inputBuffer.floatChannelData![0][1] = 2
    inputBuffer.floatChannelData![1][0] = 3
    inputBuffer.floatChannelData![1][1] = 4
    let outputBuffer = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: 2)!
    try converter.convert(to: outputBuffer, from: inputBuffer)

    let samples = Array(UnsafeBufferPointer(start: outputBuffer.floatChannelData![0], count: 4))
    #expect(samples == [1, 3, 2, 4])
  }

  @Test
  func `skips conversion when the formats match`() throws {
    let input = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 1)!
    let target = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 48000, channels: 1, interleaved: true)!

    #expect(try AudioStream.makeConverter(from: input, to: target) == nil)
  }

  @Test
  func `throws when no converter is available`() {
    let input = AVAudioFormat(standardFormatWithSampleRate: 0, channels: 0)!
    let target = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 48000, channels: 1, interleaved: true)!

    #expect(throws: AudioStreamException.self) {
      try AudioStream.makeConverter(from: input, to: target)
    }
  }
}
