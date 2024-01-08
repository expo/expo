package expo.modules.clipboard

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.ProviderInfo
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import android.text.TextUtils
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import org.xmlpull.v1.XmlPullParser.END_DOCUMENT
import org.xmlpull.v1.XmlPullParser.START_TAG
import org.xmlpull.v1.XmlPullParserException
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException

/**
 * This is a modified version of [FileProvider]
 * that facilitates exposing files associated with an app by creating
 * a `content://` uri without using Androids URI permission mechanism.
 * In contrast to [FileProvider], this provider _must_ be exported.
 *
 * The difference is that [FileProvider] forbids provider to be _exported_
 * which means it cannot easily grant access to any app installed
 * on the device. This becomes even more problematic with API 31, when
 * [PackageManager.getInstalledApplications] doesn't return all
 * installed apps, so we cannot iterate and use [Context.grantUriPermission]
 * easily
 *
 * For usage details, see [FileProvider] documentation
 */
class ClipboardFileProvider : ContentProvider() {
  private val defaultProjectionColumns = arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE)

  private lateinit var strategy: PathStrategy

  override fun onCreate() = true

  /**
   * After the [ClipboardFileProvider] is instantiated, this method is called to provide the system with
   * information about the provider.
   *
   * @param context A [Context] for the current component.
   * @param info A [ProviderInfo] for the new provider.
   */
  override fun attachInfo(context: Context, info: ProviderInfo) {
    super.attachInfo(context, info)

    if (!info.exported) {
      throw AssertionError("ClipboardFileProvider must be exported")
    }

    strategy = getPathStrategy(context, info.authority)
  }

  /**
   * Returns the MIME type of a content URI returned by
   * [getUriForFile()][getUriForFile].
   *
   * @param uri A content URI returned by
   * [getUriForFile()][getUriForFile].
   * @return If the associated file has an extension, the MIME type associated with that
   * extension; otherwise `application/octet-stream`.
   */
  override fun getType(uri: Uri): String {
    val file: File = strategy.getFileForUri(uri)
    val lastDot = file.name.lastIndexOf('.')
    if (lastDot >= 0) {
      val extension = file.name.substring(lastDot + 1)
      MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)?.let {
        return it
      }
    }
    return "application/octet-stream"
  }

  override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? {
    val projection = projection ?: defaultProjectionColumns
    val file: File = strategy.getFileForUri(uri)
    var columns = arrayOfNulls<String>(projection.size)
    var values = arrayOfNulls<Any>(projection.size)
    var i = 0
    for (column in projection) {
      when (column) {
        OpenableColumns.DISPLAY_NAME -> {
          columns[i] = OpenableColumns.DISPLAY_NAME
          values[i++] = file.name
        }

        OpenableColumns.SIZE -> {
          columns[i] = OpenableColumns.SIZE
          values[i++] = file.length()
        }
      }
    }
    columns = columns.copyOf(i)
    values = values.copyOf(i)
    return MatrixCursor(columns, 1).apply {
      addRow(values)
    }
  }

  override fun insert(uri: Uri, values: ContentValues?): Uri =
    throw UnsupportedOperationException("This is a read-only provider")

  override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int =
    throw UnsupportedOperationException("This is a read-only provider")

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int =
    throw UnsupportedOperationException("This is a read-only provider")

  @Throws(FileNotFoundException::class)
  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
    require("r" == mode) { "mode must be \"r\"" }
    val file = strategy.getFileForUri(uri)
    return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
  }

  companion object {
    private const val META_DATA_FILE_PROVIDER_PATHS =
      "expo.modules.clipboard.CLIPBOARD_FILE_PROVIDER_PATHS"

    private const val TAG_ROOT_PATH = "root-path"
    private const val TAG_FILES_PATH = "files-path"
    private const val TAG_CACHE_PATH = "cache-path"
    private const val TAG_EXTERNAL = "external-path"
    private const val TAG_EXTERNAL_FILES = "external-files-path"
    private const val TAG_EXTERNAL_CACHE = "external-cache-path"

    private const val ATTR_NAME = "name"
    private const val ATTR_PATH = "path"

    private val DEVICE_ROOT = File("/")

    private val cache: HashMap<String, PathStrategy> = HashMap()

    /**
     * Return a content URI for a given [File]. A PublicFileProvider can only return a
     * `content` [Uri] for file paths defined in their `<paths>`
     * meta-data element. See the Class Overview for more information.
     *
     * @param context A [Context] for the current component.
     * @param authority The authority of a [ClipboardFileProvider] defined in a
     * `<provider>` element in your app's manifest.
     * @param file A [File] pointing to the filename for which you want a
     * `content` [Uri].
     * @return A content URI for the file.
     * @throws IllegalArgumentException When the given [File] is outside
     * the paths supported by the provider.
     */
    fun getUriForFile(context: Context, authority: String, file: File): Uri? {
      val strategy = getPathStrategy(context, authority)
      return strategy.getUriForFile(file)
    }

    /**
     * Return {@link PathStrategy} for given authority, either by parsing or
     * returning from cache.
     */
    internal fun getPathStrategy(context: Context, authority: String): PathStrategy {
      var pathStrategy: PathStrategy
      synchronized(cache) {
        pathStrategy = cache[authority] ?: run {
          try {
            pathStrategy = parsePathStrategy(context, authority)
          } catch (e: IOException) {
            throw IllegalArgumentException(
              "Failed to parse $META_DATA_FILE_PROVIDER_PATHS meta-data", e
            )
          } catch (e: XmlPullParserException) {
            throw IllegalArgumentException(
              "Failed to parse $META_DATA_FILE_PROVIDER_PATHS meta-data", e
            )
          }
          cache[authority] = pathStrategy
          pathStrategy
        }
      }
      return pathStrategy
    }

    /**
     * Parse and return [PathStrategy] for given authority as defined in
     * [META_DATA_FILE_PROVIDER_PATHS] `<meta-data>`.
     *
     * @see .getPathStrategy
     */
    @Throws(IOException::class, XmlPullParserException::class)
    private fun parsePathStrategy(context: Context, authority: String): PathStrategy {
      val pathStrategy = SimplePathStrategy(authority)
      val packageManager = context.packageManager
      val info = packageManager.resolveContentProvider(authority, PackageManager.GET_META_DATA)
        ?: throw IllegalArgumentException("Couldn't find meta-data for provider with authority $authority")
      val parser = info.loadXmlMetaData(packageManager, META_DATA_FILE_PROVIDER_PATHS)
        ?: throw IllegalArgumentException("Missing $META_DATA_FILE_PROVIDER_PATHS meta-data")
      var type: Int
      while (parser.next().also { type = it } != END_DOCUMENT) {
        if (type != START_TAG) continue

        val tag = parser.name
        val target: File? = targetFileFromTag(tag, context)
        target?.let {
          val name = parser.getAttributeValue(null, ATTR_NAME)
          val path = parser.getAttributeValue(null, ATTR_PATH)
          pathStrategy.addRoot(name, buildPath(it, path))
        }
      }
      return pathStrategy
    }

    private fun targetFileFromTag(tag: String, context: Context): File? = when (tag) {
      TAG_ROOT_PATH -> DEVICE_ROOT
      TAG_FILES_PATH -> context.filesDir
      TAG_CACHE_PATH -> context.cacheDir
      TAG_EXTERNAL -> Environment.getExternalStorageDirectory()
      TAG_EXTERNAL_FILES -> {
        val externalFilesDirs: Array<File> = context.getExternalFilesDirs(null)
        externalFilesDirs.takeIf { it.isNotEmpty() }?.let { it[0] }
      }

      TAG_EXTERNAL_CACHE -> {
        val externalCacheDirs: Array<File> = context.externalCacheDirs
        externalCacheDirs.takeIf { it.isNotEmpty() }?.let { it[0] }
      }

      else -> null
    }

    private fun buildPath(base: File, vararg segments: String?): File {
      var cur = base
      for (segment in segments) {
        if (segment != null) {
          cur = File(cur, segment)
        }
      }
      return cur
    }
  }

  /**
   * Strategy for mapping between [File] and [Uri].
   *
   *
   * Strategies must be symmetric so that mapping a [File] to a
   * [Uri] and then back to a [File] points at the original
   * target.
   *
   *
   * Strategies must remain consistent across app launches, and not rely on
   * dynamic state. This ensures that any generated [Uri] can still be
   * resolved if your process is killed and later restarted.
   *
   * @see SimplePathStrategy
   */
  internal interface PathStrategy {
    /**
     * Return a [Uri] that represents the given [File].
     */
    fun getUriForFile(file: File): Uri?

    /**
     * Return a [File] that represents the given [Uri].
     */
    fun getFileForUri(uri: Uri): File
  }

  /**
   * Strategy that provides access to files living under a narrow whitelist of
   * filesystem roots. It will throw [SecurityException] if callers try
   * accessing files outside the configured roots.
   *
   *
   * For example, if configured with
   * `addRoot("myfiles", context.getFilesDir())`, then
   * `context.getFileStreamPath("foo.txt")` would map to
   * `content://myauthority/myfiles/foo.txt`.
   */
  internal class SimplePathStrategy(private val authority: String) : PathStrategy {
    private val roots: HashMap<String, File> = HashMap()

    /**
     * Add a mapping from a name to a filesystem root. The provider only offers
     * access to files that live under configured roots.
     */
    fun addRoot(name: String?, root: File) {
      require(name != null && !TextUtils.isEmpty(name)) { "Name must not be empty" }
      val newRoot = try {
        // Resolve to canonical path to keep path checking fast
        root.canonicalFile
      } catch (e: IOException) {
        throw IllegalArgumentException("Failed to resolve canonical path for $root", e)
      }
      roots[name] = newRoot
    }

    override fun getUriForFile(file: File): Uri? {
      var path: String = try {
        file.canonicalPath
      } catch (e: IOException) {
        throw java.lang.IllegalArgumentException("Failed to resolve canonical path for $file")
      }

      // Find the most-specific root path
      var mostSpecific: Map.Entry<String, File>? = null
      for (root in roots.entries) {
        val rootPath = root.value.path
        if (path.startsWith(rootPath) && (
            mostSpecific == null ||
              rootPath.length > mostSpecific.value.path.length
            )
        ) {
          mostSpecific = root
        }
      }
      requireNotNull(mostSpecific) { "Failed to find configured root that contains $path" }

      // Start at first char of path under root
      val rootPath = mostSpecific.value.path
      path = if (rootPath.endsWith("/")) {
        path.substring(rootPath.length)
      } else {
        path.substring(rootPath.length + 1)
      }

      // Encode the tag and path separately
      path = Uri.encode(mostSpecific.key) + '/' + Uri.encode(path, "/")
      return Uri.Builder()
        .scheme("content")
        .authority(authority)
        .encodedPath(path)
        .build()
    }

    override fun getFileForUri(uri: Uri): File {
      var path = uri.encodedPath!!
      val splitIndex = path.indexOf('/', 1)
      val tag = Uri.decode(path.substring(1, splitIndex))
      path = Uri.decode(path.substring(splitIndex + 1))
      val root = roots[tag]
        ?: throw java.lang.IllegalArgumentException("Unable to find configured root for $uri")
      var file = File(root, path)
      file = try {
        file.canonicalFile
      } catch (e: IOException) {
        throw java.lang.IllegalArgumentException("Failed to resolve canonical path for $file")
      }
      if (!file.startsWith(root)) {
        throw SecurityException("Resolved path jumped beyond configured root")
      }
      return file
    }
  }
}
