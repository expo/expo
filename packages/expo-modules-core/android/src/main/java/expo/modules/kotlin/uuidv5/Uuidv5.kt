package expo.modules.kotlin.uuidv5

import java.nio.ByteBuffer
import java.security.MessageDigest
import java.util.UUID

internal fun uuidv5(namespace: UUID, name: String): UUID {
  val sha1 = MessageDigest.getInstance("SHA-1")
  sha1.update(toBytes(namespace))
  sha1.update(name.toByteArray())
  val hash = sha1.digest()

  hash[6] = (hash[6].toInt() and 0x0F or 0x50).toByte()
  hash[8] = (hash[8].toInt() and 0x3F or 0x80).toByte()

  val buffer = ByteBuffer.wrap(hash)
  val high = buffer.long
  val low = buffer.long

  return UUID(high, low)
}

internal fun toBytes(uuid: UUID): ByteArray {
  val bb = ByteBuffer.wrap(ByteArray(16))
  bb.putLong(uuid.mostSignificantBits)
  bb.putLong(uuid.leastSignificantBits)
  return bb.array()
}
