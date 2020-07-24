package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.net.Uri
import android.os.AsyncTask
import expo.modules.imagepicker.fileproviders.FileProvider
import org.unimodules.core.Promise
import java.io.File

/**
 * Base class for tasks which will process result of other activities like system camera or crop tool.
 */
abstract class ImagePickerResultTask(protected val promise: Promise,
                                     protected val uri: Uri,
                                     protected val contentResolver: ContentResolver,
                                     protected val fileProvider: FileProvider) : AsyncTask<Void?, Void?, Void?>()
