package expo.modules.updates.procedures

import expo.modules.updates.statemachine.UpdatesStateEvent
import expo.modules.updates.statemachine.UpdatesStateValue

/**
 * Base class for all procedures that transition or reset state on the UpdatesStateMachine.
 * State machine state may only be mutated in subclasses of this class to ensure serial
 * (well-defined) ordering of state transitions.
 */
abstract class StateMachineProcedure {
  interface StateMachineProcedureContext {
    /**
     * Transition the state machine forward to a new state.
     */
    fun processStateEvent(event: UpdatesStateEvent)

    /**
     * Get the current state.
     */
    @Deprecated(message = "Avoid needing to access current state to know how to transition to next state")
    fun getCurrentState(): UpdatesStateValue

    /**
     * Reset the machine to its starting state. Should only be called after the app restarts (reloadAsync()).
     */
    fun resetState()
  }

  interface ProcedureContext : StateMachineProcedureContext {
    /**
     * Must be called when the StateMachineProcedure is done updating the state machine. Usually
     * at the end of work in the run method.
     */
    fun onComplete()
  }

  abstract fun run(procedureContext: ProcedureContext)
}
