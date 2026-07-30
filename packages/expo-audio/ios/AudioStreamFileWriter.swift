import Foundation

internal final class AudioStreamFileWriter {
  let url: URL
  private let format: AudioStreamFileFormat
  private let sampleRate: Double
  private let channels: Int
  private let encoding: AudioStreamEncoding

  private let fileHandle: FileHandle
  private(set) var pcmBytesWritten: UInt64 = 0
  private(set) var framesWritten: UInt64 = 0
  private let bytesPerSample: Int
  private let bytesPerFrame: Int

  init(url: URL, format: AudioStreamFileFormat, sampleRate: Double, channels: Int, encoding: AudioStreamEncoding) throws {
    self.url = url
    self.format = format
    self.sampleRate = sampleRate
    self.channels = channels
    self.encoding = encoding
    self.bytesPerSample = encoding == .int16 ? 2 : 4
    self.bytesPerFrame = channels * (encoding == .int16 ? 2 : 4)

    let appending = FileManager.default.fileExists(atPath: url.path)
    if !appending {
      FileManager.default.createFile(atPath: url.path, contents: nil, attributes: nil)
    }
    guard let handle = try? FileHandle(forUpdating: url) else {
      throw AudioStreamFileException(
        "Couldn't open file for writing at \(url.path). Check that the directory exists and the app has write permission."
      )
    }
    self.fileHandle = handle

    if format == .wav {
      if appending {
        // Read the existing PCM data size from the WAV data-chunk header at offset 40
        // so that pcmBytesWritten reflects what's already on disk.
        try handle.seek(toOffset: 40)
        if let existing = try handle.read(upToCount: 4), existing.count == 4 {
          let existingBytes = existing.withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
          pcmBytesWritten = UInt64(existingBytes)
          if bytesPerFrame > 0 {
            framesWritten = pcmBytesWritten / UInt64(bytesPerFrame)
          }
        }
        try handle.seekToEnd()
      } else {
        try writeWavHeader(dataSize: 0)
      }
    }
  }

  func append(pcmData: Data) throws {
    try fileHandle.seekToEnd()
    try fileHandle.write(contentsOf: pcmData)
    pcmBytesWritten += UInt64(pcmData.count)
    if bytesPerFrame > 0 {
      framesWritten = pcmBytesWritten / UInt64(bytesPerFrame)
    }
    if format == .wav {
      try updateWavHeader()
    }
  }

  func finish() throws -> (totalSize: UInt64, framesWritten: UInt64) {
    if format == .wav {
      try updateWavHeader()
    }
    try fileHandle.synchronize()
    try fileHandle.close()
    let totalSize = format == .wav ? pcmBytesWritten + 44 : pcmBytesWritten
    return (totalSize, framesWritten)
  }

  // MARK: - WAV Header

  private func writeWavHeader(dataSize: UInt32) throws {
    let header = Self.makeWavHeader(dataSize: dataSize, sampleRate: sampleRate, channels: channels, encoding: encoding)
    try fileHandle.seek(toOffset: 0)
    try fileHandle.write(contentsOf: header)
  }

  static func makeWavHeader(dataSize: UInt32, sampleRate: Double, channels: Int, encoding: AudioStreamEncoding) -> Data {
    let bitsPerSample: UInt16 = encoding == .int16 ? 16 : 32
    let audioFormat: UInt16 = encoding == .int16 ? 1 : 3  // 1 = PCM, 3 = IEEE float
    let sr = UInt32(sampleRate)
    let ch = UInt16(channels)
    let byteRate = sr * UInt32(channels) * UInt32(bitsPerSample / 8)
    let blockAlign = ch * UInt16(bitsPerSample / 8)
    let riffSize = 36 + dataSize

    var header = Data(capacity: 44)
    // RIFF chunk
    header.append(contentsOf: [0x52, 0x49, 0x46, 0x46])  // "RIFF"
    header.appendLE(riffSize)
    header.append(contentsOf: [0x57, 0x41, 0x56, 0x45])  // "WAVE"
    // fmt chunk
    header.append(contentsOf: [0x66, 0x6D, 0x74, 0x20])  // "fmt "
    header.appendLE(UInt32(16))                            // fmt chunk size
    header.appendLE(audioFormat)
    header.appendLE(ch)
    header.appendLE(sr)
    header.appendLE(byteRate)
    header.appendLE(blockAlign)
    header.appendLE(bitsPerSample)
    // data chunk
    header.append(contentsOf: [0x64, 0x61, 0x74, 0x61])  // "data"
    header.appendLE(dataSize)

    return header
  }

  private func updateWavHeader() throws {
    guard pcmBytesWritten <= UInt32.max else {
      // WAV format uses 32-bit size fields; stop updating the header above 4 GiB to avoid corruption.
      return
    }
    let dataSize = UInt32(pcmBytesWritten)
    let riffSize = 36 + dataSize
    // Update RIFF size at offset 4
    try fileHandle.seek(toOffset: 4)
    var riffLE = riffSize.littleEndian
    try fileHandle.write(contentsOf: Data(bytes: &riffLE, count: 4))
    // Update data size at offset 40
    try fileHandle.seek(toOffset: 40)
    var dataSizeLE = dataSize.littleEndian
    try fileHandle.write(contentsOf: Data(bytes: &dataSizeLE, count: 4))
    // Restore position to end of file
    try fileHandle.seekToEnd()
  }
}

// MARK: - Data helpers

private extension Data {
  mutating func appendLE<T: FixedWidthInteger>(_ value: T) {
    var v = value.littleEndian
    append(Data(bytes: &v, count: MemoryLayout<T>.size))
  }
}
