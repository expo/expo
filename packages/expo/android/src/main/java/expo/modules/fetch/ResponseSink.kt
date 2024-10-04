// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import java.nio.ByteBuffer

internal class ResponseSink {
  private val bodyQueue: MutableList<ByteArray> = mutableListOf()
  private var isFinalized = false
  var bodyUsed = false
    private set

  internal fun appendBufferBody(data: ByteArray) {
    bodyUsed = true
    bodyQueue.add(data)
  }

  fun finalize(): ByteArray {
    val size = bodyQueue.sumOf { it.size }
    val byteBuffer = ByteBuffer.allocate(size)
    for (byteArray in bodyQueue) {
      byteBuffer.put(byteArray)
    }
    bodyQueue.clear()
    bodyUsed = true
    isFinalized = true
    return byteBuffer.array()
  }
}
