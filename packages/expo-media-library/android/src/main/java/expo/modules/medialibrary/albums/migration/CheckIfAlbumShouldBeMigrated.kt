package expo.modules.medialibrary.albums.migration

import android.content.Context
import android.os.AsyncTask
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.Promise
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryConstants

@RequiresApi(Build.VERSION_CODES.R)
class CheckIfAlbumShouldBeMigrated(
  private val context: Context,
  private val albumId: String,
  private val promise: Promise
) : AsyncTask<Void?, Void?, Void?>() {
  public override fun doInBackground(vararg voids: Void?): Void? {
    val albumDir = MediaLibraryUtils.getAlbumFile(context, albumId)
    if (albumDir == null) {
      promise.reject(MediaLibraryConstants.ERROR_NO_ALBUM, "Couldn't find album")
    } else {
      promise.resolve(!albumDir.canWrite())
    }
    return null
  }
}
