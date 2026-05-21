/**
 * An event emitted when assets in the media library change.
 */
export type MediaLibraryAssetsChangeEvent = {
  /**
   * Whether the media library's changes can be described as incremental changes.
   * `true` indicates the changes are described by the `insertedAssets`, `deletedAssets` and
   * `updatedAssets` values. `false` indicates that the scope of changes is too large and you
   * should perform a full assets reload.
   * On Android this is always `false` because the platform does not provide incremental change details.
   */
  hasIncrementalChanges: boolean;
  /**
   * Array of asset IDs (`ph://` URIs) that have been inserted to the library.
   * Only populated when `hasIncrementalChanges` is `true`.
   * @platform ios
   */
  insertedAssets?: string[];
  /**
   * Array of asset IDs (`ph://` URIs) that have been deleted from the library.
   * Only populated when `hasIncrementalChanges` is `true`.
   * @platform ios
   */
  deletedAssets?: string[];
  /**
   * Array of asset IDs (`ph://` URIs) that have been updated.
   * Only populated when `hasIncrementalChanges` is `true`.
   * @platform ios
   */
  updatedAssets?: string[];
};
