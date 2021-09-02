package expo.modules.image

import android.os.Parcel
import android.os.Parcelable
import com.facebook.react.bridge.WritableNativeMap

data class ExpoImageSize(val width: Int, val height: Int) : Parcelable {
  constructor(parcel: Parcel) : this(parcel.readInt(), parcel.readInt())

  override fun writeToParcel(parcel: Parcel, flags: Int) {
    parcel.writeInt(width)
    parcel.writeInt(height)
  }

  override fun describeContents(): Int = 0

  fun asWritableNativeMap(): WritableNativeMap = WritableNativeMap().apply {
    putInt("width", width)
    putInt("height", height)
  }

  companion object CREATOR : Parcelable.Creator<ExpoImageSize> {
    override fun createFromParcel(parcel: Parcel): ExpoImageSize = ExpoImageSize(parcel)

    override fun newArray(size: Int): Array<ExpoImageSize?> = arrayOfNulls(size)
  }
}
