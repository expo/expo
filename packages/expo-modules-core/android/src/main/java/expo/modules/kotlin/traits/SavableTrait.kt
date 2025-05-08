package expo.modules.kotlin.traits

import android.graphics.Bitmap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.objects.ObjectDefinitionData
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.weak
import java.io.File
import java.util.UUID
import kotlin.reflect.KClass

class SavableTrait<InputType> @PublishedApi internal constructor(
  val exportImpl: (AppContext) -> ObjectDefinitionData
) : Trait<InputType> {
  override fun export(appContext: AppContext) = exportImpl(appContext)

  companion object {
    data class SavableBitmapOptions(
      val compression: Int = 100
    ) : Record

    @PublishedApi
    internal inline fun <reified InputType, reified OptionType> createImplementation(
      appContext: AppContext,
      crossinline saveToFile: (file: File, input: InputType, options: OptionType) -> Unit
    ): ObjectDefinitionData {
      val appContextWeakRef = appContext.weak()

      return ObjectDefinitionBuilder().apply {
        AsyncFunction("saveAsync") { input: InputType, options: OptionType ->
          val context = appContextWeakRef.get() ?: throw Exceptions.AppContextLost()
          val outputFile = File(context.cacheDirectory, UUID.randomUUID().toString())
          outputFile.createNewFile()

          saveToFile(outputFile, input, options)
        }
      }.buildObject()
    }

    inline fun <reified T : SharedRef<Bitmap>> create(klass: KClass<T> = T::class) =
      SavableTrait<T>(
        exportImpl = { appContext ->
          createImplementation<T, SavableBitmapOptions>(appContext) { file, input, options ->
            input.appContext
            input.ref.compress(
              Bitmap.CompressFormat.PNG,
              options.compression,
              file.outputStream()
            )
          }
        }
      )
  }
}
