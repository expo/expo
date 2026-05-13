// Unique Symbols used as private keys on transition objects. They act as a sealed accessor:
// only this module and the component can read the underlying record arrays from an
// EnterTransitionType or ExitTransitionType, preventing consumers from bypassing the factory API.
//
// Exported from this file for internal use (component + tests), but NOT re-exported from
// the package's public index.
export const ENTER_TRANSITION_SYMBOL = Symbol('enterTransition');
export const EXIT_TRANSITION_SYMBOL = Symbol('exitTransition');
