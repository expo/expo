import Foundation

struct Snack: Identifiable, Codable {
    let id: String
    let name: String
    let description: String?
    let url: String
    let previewUrl: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    init(
        id: String,
        name: String,
        description: String? = nil,
        url: String,
        previewUrl: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.url = url
        self.previewUrl = previewUrl
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

extension Snack {
    static let mock = Snack(
        id: "1",
        name: "My Snack",
        description: "A sample Snack project",
        url: "exp://exp.host/@username/my-snack",
        previewUrl: "https://snack.expo.dev/@username/my-snack",
        createdAt: Date(),
        updatedAt: Date()
    )
    
    static let mockList = [
        Snack(id: "1", name: "My Snack", url: "exp://exp.host/@username/my-snack"),
        Snack(id: "2", name: "Button Demo", url: "exp://exp.host/@username/button-demo"),
        Snack(id: "3", name: "Navigation Example", url: "exp://exp.host/@username/navigation-example")
    ]
}