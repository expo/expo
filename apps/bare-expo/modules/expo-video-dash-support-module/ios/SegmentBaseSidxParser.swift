import Foundation

enum SegmentBaseSidxParser {
  static func parse(indexData: Data, indexRangeStart: Int64) throws -> [SegmentByteRange] {
    guard let boxStart = findSidxBoxStart(in: indexData) else {
      throw SegmentBaseDASHError.invalidIndexData
    }

    let boxSize = Int64(try readUInt32(indexData, offset: boxStart))
    let version = try readUInt8(indexData, offset: boxStart + 8)
    let timescale = Double(try readUInt32(indexData, offset: boxStart + 16))

    let firstOffsetOffset = version == 0 ? boxStart + 24 : boxStart + 28
    let firstOffset = version == 0
      ? Int64(try readUInt32(indexData, offset: firstOffsetOffset))
      : Int64(try readUInt64(indexData, offset: firstOffsetOffset))
    let reservedOffset = version == 0 ? boxStart + 28 : boxStart + 36
    let referenceCount = Int(try readUInt16(indexData, offset: reservedOffset + 2))
    var entryOffset = reservedOffset + 4
    var currentOffset = indexRangeStart + boxSize + firstOffset

    var segments: [SegmentByteRange] = []
    segments.reserveCapacity(referenceCount)

    for _ in 0..<referenceCount {
      let referenceInfo = try readUInt32(indexData, offset: entryOffset)
      let referenceType = (referenceInfo & 0x8000_0000) != 0
      if referenceType {
        throw SegmentBaseDASHError.hierarchicalSidxUnsupported
      }

      let referencedSize = Int64(referenceInfo & 0x7fff_ffff)
      let subsegmentDuration = Double(try readUInt32(indexData, offset: entryOffset + 4))
      let duration = subsegmentDuration / timescale

      segments.append(
        SegmentByteRange(
          duration: duration,
          byteRange: ByteRange(start: currentOffset, length: referencedSize)
        )
      )

      currentOffset += referencedSize
      entryOffset += 12
    }

    return segments
  }

  private static func findSidxBoxStart(in data: Data) -> Int? {
    let bytes = Array(data)
    guard bytes.count >= 8 else {
      return nil
    }

    for offset in 4..<(bytes.count - 3) {
      if bytes[offset] == 0x73, bytes[offset + 1] == 0x69, bytes[offset + 2] == 0x64, bytes[offset + 3] == 0x78 {
        return offset - 4
      }
    }
    return nil
  }

  private static func readUInt8(_ data: Data, offset: Int) throws -> UInt8 {
    guard offset < data.count else {
      throw SegmentBaseDASHError.invalidIndexData
    }
    return data[offset]
  }

  private static func readUInt16(_ data: Data, offset: Int) throws -> UInt16 {
    guard offset + 2 <= data.count else {
      throw SegmentBaseDASHError.invalidIndexData
    }
    return data[offset..<(offset + 2)].reduce(0) { ($0 << 8) | UInt16($1) }
  }

  private static func readUInt32(_ data: Data, offset: Int) throws -> UInt32 {
    guard offset + 4 <= data.count else {
      throw SegmentBaseDASHError.invalidIndexData
    }
    return data[offset..<(offset + 4)].reduce(0) { ($0 << 8) | UInt32($1) }
  }

  private static func readUInt64(_ data: Data, offset: Int) throws -> UInt64 {
    guard offset + 8 <= data.count else {
      throw SegmentBaseDASHError.invalidIndexData
    }
    return data[offset..<(offset + 8)].reduce(0) { ($0 << 8) | UInt64($1) }
  }
}
