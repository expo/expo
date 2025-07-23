package expo.modules.kotlin.views

/**
 * A marker interface for props classes that are used to pass data to Compose views.
 * Needed for the R8 to not remove needed  signatures that are used to receive prop types.
 */
interface ComposeProps
