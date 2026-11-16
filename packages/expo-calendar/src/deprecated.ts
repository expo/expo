import { ExpoCalendar, ExpoCalendarEvent } from './Calendar';
import * as Calendars from './Calendars';

/**
 * @deprecated Use `ExpoCalendar.getDefaultSync()` instead.
 */
export const getDefaultCalendarSync = ExpoCalendar.getDefaultSync;

/**
 * @deprecated Use `ExpoCalendar.getAll()` instead.
 */
export const getCalendars = ExpoCalendar.getAll;

/**
 * @deprecated Use `ExpoCalendar.create()` instead.
 */
export const createCalendar = ExpoCalendar.create;

/**
 * @deprecated Use `ExpoCalendar.presentPicker()` instead.
 */
export const presentPicker = ExpoCalendar.presentPicker;

/**
 * @deprecated Use `ExpoCalendarEvent.list()` instead.
 */
export const listEvents = ExpoCalendarEvent.list;

/**
 * @deprecated Use `Calendars.requestCalendarPermissions()` instead.
 */
export const requestCalendarPermissions = Calendars.requestCalendarPermissions;

/**
 * @deprecated Use `Calendars.getCalendarPermissions()` instead.
 */
export const getCalendarPermissions = Calendars.getCalendarPermissions;

/**
 * @deprecated Use `Calendars.requestRemindersPermissions()` instead.
 */
export const requestRemindersPermissions = Calendars.requestRemindersPermissions;

/**
 * @deprecated Use `Calendars.getRemindersPermissions()` instead.
 */
export const getRemindersPermissions = Calendars.getRemindersPermissions;

/**
 * @deprecated Use `Calendars.getSourcesSync()` instead.
 */
export const getSourcesSync = Calendars.getSourcesSync;
