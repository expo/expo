import { RecurrenceRule as ExpoCalendarRecurrenceRule } from '../Calendar';
export type RecurrenceRule = {
    /**
     * Date on which the calendar item should stop recurring; overrides `occurrence` if both are specified.
     * Null if it is `occurrence` based.
     */
    endDate?: string | Date | null;
    /**
     * Number of times the calendar item should recur before stopping.
     * Null if it is `endDate` based.
     */
    occurrence?: number | null;
} & ExpoCalendarRecurrenceRule;
//# sourceMappingURL=RecurrenceRule.d.ts.map