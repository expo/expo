package expo.modules.ui.textfield.model

/**
 * ### Next
 *
 * Model object that represents a set of actions that should take place when transition from one
 * ``State`` to another occurs.
 *
 * @author taflanidi
 */
class Next(val state: State, val insert: Char?, val pass: Boolean, val value: Char?)
