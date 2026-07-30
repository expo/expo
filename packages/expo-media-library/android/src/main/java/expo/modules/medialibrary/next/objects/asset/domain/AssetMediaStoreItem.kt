package expo.modules.medialibrary.next.objects.asset.domain

sealed interface AssetMediaStoreItem {
  data class Image(val asset: MediaStoreImage) : AssetMediaStoreItem
  data class Video(val asset: MediaStoreVideo) : AssetMediaStoreItem
  data class Audio(val asset: MediaStoreAudio) : AssetMediaStoreItem
}
