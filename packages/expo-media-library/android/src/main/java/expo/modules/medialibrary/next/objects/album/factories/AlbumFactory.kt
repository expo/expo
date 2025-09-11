package expo.modules.medialibrary.next.objects.album.factories

import android.net.Uri
import expo.modules.medialibrary.next.objects.album.Album
import expo.modules.medialibrary.next.objects.asset.Asset

interface AlbumFactory {
  suspend fun createFromAssets(albumName: String, assets: List<Asset>, deleteOriginalAssets: Boolean): Album
  suspend fun createFromFilePaths(albumName: String, filePaths: List<Uri>): Album
}
