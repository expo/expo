import AppIntents

/**
 All App Shortcuts for this app. Phrases are compiled into the app and cannot be created
 at runtime. Required parameters that are not in the launch phrase are collected by Siri
 as follow-up questions.

 System rules:
 - Every phrase must include \(.applicationName) or the phrase is dropped at build time.
 - At most 10 App Shortcuts per app. Apple recommends 2-5.
 */
struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: IncreaseCounterIntent(),
      phrases: [
        "Increase the counter in \(.applicationName)"
      ],
      shortTitle: "Increase Counter",
      systemImageName: "plus.circle"
    )

    AppShortcut(
      intent: OrderFoodIntent(),
      phrases: [
        "Place an order in \(.applicationName)",
        "Order food in \(.applicationName)",
        "Order \(\.$dish) in \(.applicationName)",
        "Place an order for \(\.$dish) in \(.applicationName)"
      ],
      shortTitle: "Place an order",
      systemImageName: "fork.knife"
    )

    AppShortcut(
      intent: CreateJournalEntryShortcutIntent(),
      phrases: [
        "Create a journal entry in \(.applicationName)",
        "Write a journal entry in \(.applicationName)"
      ],
      shortTitle: "Journal Entry",
      systemImageName: "book.pages"
    )
  }
}
