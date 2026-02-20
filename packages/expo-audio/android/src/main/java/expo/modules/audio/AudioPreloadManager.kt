package expo.modules.audio

import androidx.core.net.toUri
import androidx.media3.datasource.ByteArrayDataSource
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DataSpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentHashMap

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
object AudioPreloadManager {
  private val store = ConcurrentHashMap<String, ByteArray>()

  private inline fun <T : DataSource, R> T.use(block: (T) -> R): R {
    try {
      return block(this)
    } finally {
      close()
    }
  }

  suspend fun preload(uri: String, factory: DataSource.Factory) = withContext(Dispatchers.IO) {
    val dataSpec = DataSpec.Builder().setUri(uri.toUri()).build()

    factory.createDataSource().use { dataSource ->
      ByteArrayOutputStream().use { outputStream ->
        dataSource.open(dataSpec)
        val buffer = ByteArray(8 * 1024)
        generateSequence {
          dataSource
            .read(buffer, 0, buffer.size)
            .takeIf { it != -1 }
        }.forEach {
          outputStream.write(buffer, 0, it)
        }
        store[uri] = outputStream.toByteArray()
      }
    }
  }

  fun get(uri: String): ByteArray? = store[uri]

  fun clearSource(uri: String) = store.remove(uri)

  fun clearAll() = store.clear()

  fun getPreloadedSources(): List<String> = store.keys().toList()
}

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class InMemoryDataSourceFactory(private val data: ByteArray) : DataSource.Factory {
  override fun createDataSource(): DataSource = ByteArrayDataSource(data)
}
