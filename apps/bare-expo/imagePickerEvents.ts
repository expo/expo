import { requireNativeModule, type EventSubscription } from 'expo-modules-core'

/**
 * Payload emitted natively the instant the user commits a non-empty selection in the OS
 * photo picker and it begins dismissing — BEFORE expo-image-picker materializes the files
 * (the iCloud download performed inside `launchImageLibraryAsync`). Use it to navigate
 * early; the picker promise still resolves later with the fully-downloaded assets.
 *
 * Wired via patches/expo-image-picker+56.0.15.patch (see
 * scripts/apply-imagepicker-selection-event.mjs):
 *   - `Events("onSelectionFinished")` on the module definition
 *   - `sendEvent("onSelectionFinished", …)` at the top of `didPickMultipleMedia`
 *
 * iOS only. The cancel path never reaches `didPickMultipleMedia`, so this fires solely for
 * committed, non-empty selections. Android emits nothing here — `launchImageLibraryAsync`
 * resolves fast enough there that the JS fallback (push on resolve) covers it.
 */
export interface SelectionFinishedEvent {
  /** Number of items the user selected. */
  selectionCount: number
  /** PHAsset local identifiers for the selection (available because the picker is
   *  configured with PHPhotoLibrary.shared()). Handy for rendering skeletons while the
   *  originals finish downloading. */
  assetIds: string[]
}

// expo-image-picker registers its native module under this legacy name.
const ExponentImagePicker = requireNativeModule('ExponentImagePicker') as {
  addListener: (
    eventName: 'onSelectionFinished',
    listener: (event: SelectionFinishedEvent) => void
  ) => EventSubscription
}

/**
 * Subscribe to the "selection committed, picker dismissing" signal. Returns an
 * EventSubscription — call `.remove()` when done (e.g. in a `finally` after the pick).
 */
export function addSelectionFinishedListener(
  listener: (event: SelectionFinishedEvent) => void
): EventSubscription {
  return ExponentImagePicker.addListener('onSelectionFinished', listener)
}
