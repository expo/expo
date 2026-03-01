import Foundation
import Compression

extension Data {
  func brotliCompressed() throws -> Data {
    var output = Data()

    let filter = try OutputFilter(.compress, using: .brotli, bufferCapacity: 65_536) { chunk in
      if let chunk = chunk {
        output.append(chunk)
      }
    }

    try filter.write(self)
    try filter.finalize()
    return output
  }

  func brotliDecompressed() throws -> Data {
    var output = Data()

    let filter = try OutputFilter(.decompress, using: .brotli, bufferCapacity: 65_536) { chunk in
      if let chunk = chunk {
        output.append(chunk)
      }
    }

    try filter.write(self)
    try filter.finalize()
    return output
  }
}
