/**
 * An enum mapping days of the week in Gregorian calendar to their index as returned by the `firstWeekday` property.
 */
export var Weekday;
(function (Weekday) {
    Weekday[Weekday["SUNDAY"] = 1] = "SUNDAY";
    Weekday[Weekday["MONDAY"] = 2] = "MONDAY";
    Weekday[Weekday["TUESDAY"] = 3] = "TUESDAY";
    Weekday[Weekday["WEDNESDAY"] = 4] = "WEDNESDAY";
    Weekday[Weekday["THURSDAY"] = 5] = "THURSDAY";
    Weekday[Weekday["FRIDAY"] = 6] = "FRIDAY";
    Weekday[Weekday["SATURDAY"] = 7] = "SATURDAY";
})(Weekday || (Weekday = {}));
/**
 * The calendar identifier, one of [Unicode calendar types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/calendar).
 * Gregorian calendar is aliased and can be referred to as both `CalendarIdentifier.GREGORIAN` and `CalendarIdentifier.GREGORY`.
 */
export var CalendarIdentifier;
(function (CalendarIdentifier) {
    /** Thai Buddhist calendar */
    CalendarIdentifier["BUDDHIST"] = "buddhist";
    /** Traditional Chinese calendar */
    CalendarIdentifier["CHINESE"] = "chinese";
    /** Coptic calendar */
    CalendarIdentifier["COPTIC"] = "coptic";
    /** Traditional Korean calendar */
    CalendarIdentifier["DANGI"] = "dangi";
    /** Ethiopic calendar, Amete Alem (epoch approx. 5493 B.C.E) */
    CalendarIdentifier["ETHIOAA"] = "ethioaa";
    /** Ethiopic calendar, Amete Mihret (epoch approx, 8 C.E.) */
    CalendarIdentifier["ETHIOPIC"] = "ethiopic";
    /** Gregorian calendar */
    CalendarIdentifier["GREGORY"] = "gregory";
    /** Gregorian calendar (alias) */
    CalendarIdentifier["GREGORIAN"] = "gregory";
    /** Traditional Hebrew calendar */
    CalendarIdentifier["HEBREW"] = "hebrew";
    /** Indian calendar */
    CalendarIdentifier["INDIAN"] = "indian";
    /** Islamic calendar */
    CalendarIdentifier["ISLAMIC"] = "islamic";
    /** Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - civil epoch) */
    CalendarIdentifier["ISLAMIC_CIVIL"] = "islamic-civil";
    /** Islamic calendar, Saudi Arabia sighting */
    CalendarIdentifier["ISLAMIC_RGSA"] = "islamic-rgsa";
    /**Islamic calendar, tabular (intercalary years [2,5,7,10,13,16,18,21,24,26,29] - astronomical epoch) */
    CalendarIdentifier["ISLAMIC_TBLA"] = "islamic-tbla";
    /** Islamic calendar, Umm al-Qura */
    CalendarIdentifier["ISLAMIC_UMALQURA"] = "islamic-umalqura";
    /** ISO calendar (Gregorian calendar using the ISO 8601 calendar week rules) */
    CalendarIdentifier["ISO8601"] = "iso8601";
    /** Japanese imperial calendar */
    CalendarIdentifier["JAPANESE"] = "japanese";
    /** Persian calendar */
    CalendarIdentifier["PERSIAN"] = "persian";
    /** Civil (algorithmic) Arabic calendar */
    CalendarIdentifier["ROC"] = "roc";
})(CalendarIdentifier || (CalendarIdentifier = {}));
//# sourceMappingURL=Localization.types.js.map