[@expo/use-updates](../README.md) / [Exports](../modules.md) / UseUpdatesEventType

# Enumeration: UseUpdatesEventType

The types of update-related events.

## Table of contents

### Enumeration Members

- [DOWNLOAD\_COMPLETE](UseUpdatesEventType.md#download_complete)
- [DOWNLOAD\_START](UseUpdatesEventType.md#download_start)
- [ERROR](UseUpdatesEventType.md#error)
- [NO\_UPDATE\_AVAILABLE](UseUpdatesEventType.md#no_update_available)
- [READ\_LOG\_ENTRIES\_COMPLETE](UseUpdatesEventType.md#read_log_entries_complete)
- [UPDATE\_AVAILABLE](UseUpdatesEventType.md#update_available)

## Enumeration Members

### DOWNLOAD\_COMPLETE

• **DOWNLOAD\_COMPLETE** = ``"downloadComplete"``

A call to `downloadUpdate()` has completed successfully.

#### Defined in

[UseUpdates.types.ts:164](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L164)

___

### DOWNLOAD\_START

• **DOWNLOAD\_START** = ``"downloadStart"``

A call to `downloadUpdate()` has started.

#### Defined in

[UseUpdates.types.ts:160](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L160)

___

### ERROR

• **ERROR** = ``"error"``

An error occurred.

#### Defined in

[UseUpdates.types.ts:156](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L156)

___

### NO\_UPDATE\_AVAILABLE

• **NO\_UPDATE\_AVAILABLE** = ``"noUpdateAvailable"``

No new update is available for the app, and the most up-to-date update is already running.
This event can be fired either from
the native code that automatically checks for an update on startup (when automatic updates
are enabled), or from the completion of checkForUpdate().

#### Defined in

[UseUpdates.types.ts:152](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L152)

___

### READ\_LOG\_ENTRIES\_COMPLETE

• **READ\_LOG\_ENTRIES\_COMPLETE** = ``"readLogEntriesComplete"``

A call to `readLogEntries()` has completed successfully.

#### Defined in

[UseUpdates.types.ts:168](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L168)

___

### UPDATE\_AVAILABLE

• **UPDATE\_AVAILABLE** = ``"updateAvailable"``

A new update is available for the app. This event can be fired either from
the native code that automatically checks for an update on startup (when automatic updates
are enabled), or from the completion of checkForUpdate().

#### Defined in

[UseUpdates.types.ts:145](https://github.com/expo/expo/blob/104b98ab49/packages/@expo/use-updates/src/UseUpdates.types.ts#L145)
