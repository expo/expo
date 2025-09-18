package expo.modules.medialibrary.next.objects.asset.factories

import android.net.Uri
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.objects.asset.Asset
import expo.modules.medialibrary.next.objects.asset.delegates.AssetDelegate

interface AssetFactory {
  fun create(contentUri: Uri): Asset
  suspend fun create(filePath: Uri, relativePath: RelativePath?): Asset
}
