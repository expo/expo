package expo.modules.medialibrary.next.objects.asset.factories

import android.net.Uri
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset

fun interface AssetFactory {
  suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset
}
