import Testing
import Foundation

@testable import ExpoAudio

@Suite("AudioStreamFileWriter.makeWavHeader")
struct AudioStreamFileWriterTests {
  @Test
  func `produces a 44 byte canonical header`() {
    let header = AudioStreamFileWriter.makeWavHeader(dataSize: 0, sampleRate: 44100, channels: 2, encoding: .int16)
    #expect(header.count == 44)
  }

  @Test
  func `lays out the RIFF, WAVE, fmt and data chunk tags`() {
    let header = AudioStreamFileWriter.makeWavHeader(dataSize: 0, sampleRate: 44100, channels: 2, encoding: .int16)

    #expect(tag(header, 0) == "RIFF")
    #expect(tag(header, 8) == "WAVE")
    #expect(tag(header, 12) == "fmt ")
    #expect(tag(header, 36) == "data")
    #expect(u32(header, 16) == 16)  // fmt chunk size
  }

  @Test
  func `encodes 16-bit integer PCM format fields`() {
    let header = AudioStreamFileWriter.makeWavHeader(dataSize: 0, sampleRate: 44100, channels: 2, encoding: .int16)

    #expect(u16(header, 20) == 1)       // audioFormat: 1 = PCM
    #expect(u16(header, 22) == 2)       // channels
    #expect(u32(header, 24) == 44100)   // sample rate
    #expect(u32(header, 28) == 176400)  // byteRate = 44100 * 2ch * 2 bytes
    #expect(u16(header, 32) == 4)       // blockAlign = 2ch * 2 bytes
    #expect(u16(header, 34) == 16)      // bitsPerSample
  }

  @Test
  func `encodes 32-bit float format fields`() {
    let header = AudioStreamFileWriter.makeWavHeader(dataSize: 0, sampleRate: 48000, channels: 1, encoding: .float32)

    #expect(u16(header, 20) == 3)       // audioFormat: 3 = IEEE float
    #expect(u16(header, 22) == 1)       // channels
    #expect(u32(header, 24) == 48000)   // sample rate
    #expect(u32(header, 28) == 192000)  // byteRate = 48000 * 1ch * 4 bytes
    #expect(u16(header, 32) == 4)       // blockAlign = 1ch * 4 bytes
    #expect(u16(header, 34) == 32)      // bitsPerSample
  }

  @Test
  func `writes the data size and a matching riff size`() {
    let header = AudioStreamFileWriter.makeWavHeader(dataSize: 1000, sampleRate: 44100, channels: 2, encoding: .int16)

    #expect(u32(header, 40) == 1000)  // data chunk size
    #expect(u32(header, 4) == 1036)   // riff size = 36 + dataSize
  }

  private func tag(_ data: Data, _ offset: Int) -> String {
    String(decoding: data[offset..<(offset + 4)], as: UTF8.self)
  }

  private func u16(_ data: Data, _ offset: Int) -> UInt16 {
    UInt16(data[offset]) | (UInt16(data[offset + 1]) << 8)
  }

  private func u32(_ data: Data, _ offset: Int) -> UInt32 {
    UInt32(data[offset])
      | (UInt32(data[offset + 1]) << 8)
      | (UInt32(data[offset + 2]) << 16)
      | (UInt32(data[offset + 3]) << 24)
  }
}
