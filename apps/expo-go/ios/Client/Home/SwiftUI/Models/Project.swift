import Foundation

struct Project: Identifiable {
    let id: String
    let name: String
    let fullName: String
    let description: String?
    let iconUrl: String?
    let packageName: String?
    let runtimeVersion: String?
    let platform: String?
    let lastUpdated: String?
    let manifestUrl: String?
    let isEASUpdate: Bool?
    
    init(
        id: String,
        name: String,
        fullName: String,
        description: String? = nil,
        iconUrl: String? = nil,
        packageName: String? = nil,
        runtimeVersion: String? = nil,
        platform: String? = nil,
        lastUpdated: String? = nil,
        manifestUrl: String? = nil,
        isEASUpdate: Bool? = nil
    ) {
        self.id = id
        self.name = name
        self.fullName = fullName
        self.description = description
        self.iconUrl = iconUrl
        self.packageName = packageName
        self.runtimeVersion = runtimeVersion
        self.platform = platform
        self.lastUpdated = lastUpdated
        self.manifestUrl = manifestUrl
        self.isEASUpdate = isEASUpdate
    }
}

extension Project {
    static let mock = Project(
        id: "1",
        name: "My Expo App",
        fullName: "@username/my-expo-app",
        description: "A sample Expo application for development",
        iconUrl: "https://example.com/icon.png",
        packageName: "com.example.myexpoapp",
        runtimeVersion: "1.0.0",
        platform: "iOS",
        lastUpdated: "2 hours ago",
        manifestUrl: "exp://192.168.1.100:19000",
        isEASUpdate: false
    )
    
    static let mockList = [
        Project(id: "1", name: "My Expo App", fullName: "@username/my-expo-app"),
        Project(id: "2", name: "Food Delivery", fullName: "@username/food-delivery"),
        Project(id: "3", name: "Weather App", fullName: "@username/weather-app"),
        Project(id: "4", name: "Todo List", fullName: "@username/todo-list")
    ]
}
