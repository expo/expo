---
"expo-notifications": patch
---

Add `setNotificationCategoriesAsync` to replace all notification categories in one call on Android and iOS. Pass an empty array to remove all categories. In Expo Go, the call replaces only the categories of the current project.

[Android] Store notification categories as JSON while continuing to read categories saved by earlier app versions. Older native versions cannot read categories saved after this upgrade. Register categories again after a native downgrade.

[Android] Remove the category methods and constants from `NotificationsService`, plus `CategoriesDelegate`, `ExpoCategoriesDelegate`, `NotificationsCategoriesSerializer`, and `ExpoNotificationsCategoriesSerializer`. Native integrations that use these APIs must update for the next SDK.

[Android][Expo Go] Return only the current project's categories from `getNotificationCategoriesAsync` and preserve `/` in category identifiers. Legacy categories without a project prefix are no longer returned.
