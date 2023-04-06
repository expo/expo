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

[UseUpdates.types.ts:154](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L154)

___

### DOWNLOAD\_START

• **DOWNLOAD\_START** = ``"downloadStart"``

A call to `downloadUpdate()` has started.

#### Defined in

[UseUpdates.types.ts:150](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L150)

___

### ERROR

• **ERROR** = ``"error"``

An error occurred.

#### Defined in

[UseUpdates.types.ts:146](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L146)

___

### NO\_UPDATE\_AVAILABLE

• **NO\_UPDATE\_AVAILABLE** = ``"noUpdateAvailable"``

No new update is available for the app, and the most up-to-date update is already running.
This event can be fired either from
the native code that automatically checks for an update on startup (when automatic updates
are enabled), or from the completion of checkForUpdate().

#### Defined in

[UseUpdates.types.ts:142](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L142)

___

### READ\_LOG\_ENTRIES\_COMPLETE

• **READ\_LOG\_ENTRIES\_COMPLETE** = ``"readLogEntriesComplete"``

A call to `readLogEntries()` has completed successfully.

#### Defined in

[UseUpdates.types.ts:158](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L158)

___

### UPDATE\_AVAILABLE

• **UPDATE\_AVAILABLE** = ``"updateAvailable"``

A new update is available for the app. This event can be fired either from
the native code that automatically checks for an update on startup (when automatic updates
are enabled), or from the completion of checkForUpdate().

#### Defined in

[UseUpdates.types.ts:135](https://github.com/expo/expo/blob/71172a5c46/packages/@expo/use-updates/src/UseUpdates.types.ts#L135)
