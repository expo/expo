import Foundation
import CommonCrypto
import CryptoKit

func uuidv5(name: String, namespace: UUID) -> UUID {
  var spaceUID = namespace.uuid
  var data = withUnsafePointer(to: &spaceUID) { [count = MemoryLayout.size(ofValue: spaceUID)] in
    Data(bytes: $0, count: count)
  }

  data.append(contentsOf: name.utf8)

  // Compute SHA1 digest
  var digest = [UInt8](repeating: 0, count: Int(CC_SHA1_DIGEST_LENGTH))
  data.withUnsafeBytes { (ptr: UnsafeRawBufferPointer) -> Void in CC_SHA1(ptr.baseAddress, CC_LONG(data.count), &digest) }

  // Set version bits:
  digest[6] = digest[6] & 0x0F | UInt8(5) << 4
  // Set variant bits:
  digest[8] = digest[8] & 0x3F | 0x80

  // Create a tuple for the final UUID
  var uuidTuple = namespace.uuid

  withUnsafeMutablePointer(to: &uuidTuple) { pointer in
    let bound = pointer.withMemoryRebound(to: UInt8.self, capacity: 16) { $0 }
    digest.enumerated().forEach { (bound + $0.offset).pointee = $0.element }
  }

  // Convert digest to UUID and return
  return UUID(uuid: uuidTuple)
}
