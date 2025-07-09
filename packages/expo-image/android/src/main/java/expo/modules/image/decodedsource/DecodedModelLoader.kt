package expo.modules.image.decodedsource

import android.graphics.drawable.Drawable
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.model.ModelLoader
import com.bumptech.glide.signature.ObjectKey

class DecodedModelLoader : ModelLoader<DecodedModel, Drawable> {
  override fun handles(model: DecodedModel): Boolean = true
  override fun buildLoadData(
    model: DecodedModel,
    width: Int,
    height: Int,
    options: Options
  ): ModelLoader.LoadData<Drawable> {
    return ModelLoader.LoadData(ObjectKey(model), DecodedFetcher(model.drawable))
  }
}
