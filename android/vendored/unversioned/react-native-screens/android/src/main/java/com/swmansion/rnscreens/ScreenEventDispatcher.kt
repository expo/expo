package com.swmansion.rnscreens

interface ScreenEventDispatcher {
    fun canDispatchLifecycleEvent(event: ScreenFragment.ScreenLifecycleEvent): Boolean
    fun updateLastEventDispatched(event: ScreenFragment.ScreenLifecycleEvent)

    /**
     * Dispatches given screen lifecycle event to JS using screen from given fragment `fragmentWrapper`
     */
    fun dispatchLifecycleEvent(event: ScreenFragment.ScreenLifecycleEvent, fragmentWrapper: ScreenFragmentWrapper)

    /**
     * Dispatches given screen lifecycle event from all non-empty child containers to JS
     */
    fun dispatchLifecycleEventInChildContainers(event: ScreenFragment.ScreenLifecycleEvent)

    fun dispatchHeaderBackButtonClickedEvent()
    fun dispatchTransitionProgressEvent(alpha: Float, closing: Boolean)

    // Concrete dispatchers
}
