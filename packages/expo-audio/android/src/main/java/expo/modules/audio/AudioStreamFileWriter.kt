package expo.modules.audio

import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Writes PCM audio to a WAV or raw PCM file with live header updates after every buffer.
 * WAV format uses 32-bit size fields; files are capped at ~2 GiB of PCM data.
 * If the target file already exists its content is appended to, not overwritten.
 */
internal class AudioStreamFileWriter(
  val file: File,
  private val format: AudioStreamFileFormat,
  private val sampleRate: Int,
  private val channels: Int,
  private val encoding: AudioStreamEncoding
) {
  private val bitsPerSample = if (encoding == AudioStreamEncoding.INT16) 16 else 32
  private val bytesPerFrame = channels * (bitsPerSample / 8)

  // Initialised in the init block so the file-existence check runs before any handle is opened.
  private val raf: RandomAccessFile?
  private val out: FileOutputStream?

  @Volatile var pcmBytesWritten: Long = 0L
    private set

  @Volatile var framesWritten: Long = 0L
    private set

  init {
    val appending = file.exists()

    if (format == AudioStreamFileFormat.WAV) {
      raf = RandomAccessFile(file, "rw")
      out = null
      if (appending && file.length() >= 44) {
        // Read existing PCM data size from WAV data-chunk header at offset 40
        raf.seek(40)
        val buf = ByteArray(4)
        if (raf.read(buf) == 4) {
          val existingBytes = ByteBuffer.wrap(buf).order(ByteOrder.LITTLE_ENDIAN).int.toLong() and 0xFFFFFFFFL
          pcmBytesWritten = existingBytes
          if (bytesPerFrame > 0) {
            framesWritten = pcmBytesWritten / bytesPerFrame
          }
        }
        raf.seek(raf.length())
      } else {
        raf.setLength(0)
        writeWavHeader(0)
      }
    } else {
      raf = null
      out = FileOutputStream(file, appending)
      if (appending) {
        pcmBytesWritten = file.length()
        if (bytesPerFrame > 0) {
          framesWritten = pcmBytesWritten / bytesPerFrame
        }
      }
    }
  }

  fun append(bytes: ByteArray) {
    if (format == AudioStreamFileFormat.WAV) {
      raf!!.seek(raf.length())
      raf.write(bytes)
      pcmBytesWritten += bytes.size
      updateWavHeader()
    } else {
      out!!.write(bytes)
      pcmBytesWritten += bytes.size
    }
    if (bytesPerFrame > 0) {
      framesWritten = pcmBytesWritten / bytesPerFrame
    }
  }

  fun finish(): Pair<Long, Long> {
    if (format == AudioStreamFileFormat.WAV) {
      updateWavHeader()
      raf!!.fd.sync()
      raf.close()
    } else {
      out!!.flush()
      out.fd.sync()
      out.close()
    }
    val totalSize = if (format == AudioStreamFileFormat.WAV) pcmBytesWritten + 44 else pcmBytesWritten
    return Pair(totalSize, framesWritten)
  }

  private fun writeWavHeader(dataSize: Int) {
    val audioFormat = if (encoding == AudioStreamEncoding.INT16) 1 else 3 // 1=PCM, 3=IEEE float
    val byteRate = sampleRate * channels * (bitsPerSample / 8)
    val blockAlign = channels * (bitsPerSample / 8)

    val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
    // RIFF chunk
    header.put("RIFF".toByteArray())
    header.putInt(36 + dataSize)
    header.put("WAVE".toByteArray())
    // fmt chunk
    header.put("fmt ".toByteArray())
    header.putInt(16)
    header.putShort(audioFormat.toShort())
    header.putShort(channels.toShort())
    header.putInt(sampleRate)
    header.putInt(byteRate)
    header.putShort(blockAlign.toShort())
    header.putShort(bitsPerSample.toShort())
    // data chunk
    header.put("data".toByteArray())
    header.putInt(dataSize)

    raf!!.seek(0)
    raf.write(header.array())
  }

  private fun updateWavHeader() {
    if (pcmBytesWritten > Int.MAX_VALUE.toLong()) {
      // WAV format uses 32-bit sizes; stop updating the header above 2 GiB to avoid corruption
      return
    }
    val dataSize = pcmBytesWritten.toInt()

    val riffBuf = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN)
    riffBuf.putInt(36 + dataSize)
    raf!!.seek(4)
    raf.write(riffBuf.array())

    val dataBuf = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN)
    dataBuf.putInt(dataSize)
    raf.seek(40)
    raf.write(dataBuf.array())
  }
}
