// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.ui.state

import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * A SharedObject base class for observable state that can be shared between
 * JavaScript and Compose views.
 *
 * Subclass this to create typed state objects using Compose's `mutableStateOf`:
 *
 *     class ToggleState : ObservableState() {
 *         var isOn by mutableStateOf(false)
 *     }
 *
 * Register in the module via `Class()`:
 *
 *     Class(ToggleState::class) {
 *         Constructor { ToggleState() }
 *         Property("isOn") { it.isOn }
 *             .set { state, value -> state.isOn = value }
 *     }
 *
 * In composables, read the state's properties directly -- Compose's snapshot
 * system will automatically subscribe to changes and trigger recomposition.
 */
open class ObservableState : SharedObject()
