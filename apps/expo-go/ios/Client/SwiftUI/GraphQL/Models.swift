// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct GraphQLResponse<T: Codable>: Codable {
  let data: T?
  let errors: [GraphQLError]?
}

struct GraphQLError: Codable {
  let message: String
  let locations: [GraphQLErrorLocation]?
  let path: [String]?
}

struct GraphQLErrorLocation: Codable {
  let line: Int
  let column: Int
}

struct MeUserActorResponse: Codable {
  let data: MeUserActorData
}

struct MeUserActorData: Codable {
  let meUserActor: UserActor
}

struct HomeScreenDataResponse: Codable {
  let data: HomeScreenData
}

struct HomeScreenData: Codable {
  let account: AccountQuery
}

struct AccountQuery: Codable {
  let byName: AccountByName
}

struct AccountByName: Codable {
  let id: String
  let name: String
  let ownerUserActor: UserActor
  let apps: [App]
  let snacks: [Snack]
  let appCount: Int
}

struct UserActor: Codable {
  let typename: String
  let id: String
  let username: String
  let firstName: String?
  let lastName: String?
  let profilePhoto: String?
  let bestContactEmail: String?
  let accounts: [Account]
  let fullName: String?

  enum CodingKeys: String, CodingKey {
    case typename = "__typename"
    case id
    case username
    case firstName
    case lastName
    case profilePhoto
    case bestContactEmail
    case accounts
    case fullName
  }
}

struct Account: Codable {
  let id: String
  let name: String
  let profileImageUrl: String?
  let ownerUserActor: UserActorSimple?

  enum CodingKeys: String, CodingKey {
    case id
    case name
    case profileImageUrl
    case ownerUserActor
  }
}

struct UserActorSimple: Codable {
  let id: String
  let username: String
  let profilePhoto: String?
  let firstName: String?
  let fullName: String?
  let lastName: String?
}

struct App: Codable {
  let id: String
  let name: String
  let fullName: String
  let ownerAccount: OwnerAccount
  let firstTwoBranches: [Branch]

  enum CodingKeys: String, CodingKey {
    case id
    case name
    case fullName
    case ownerAccount
    case firstTwoBranches
  }
}

struct OwnerAccount: Codable {
  let name: String
}

struct Branch: Codable, Equatable {
  let id: String
  let name: String
  let updates: [AppUpdate]
}

struct AppUpdate: Identifiable, Codable, Equatable {
  let id: String
  let group: String?
  let message: String?
  let createdAt: String
  let runtimeVersion: String?
  let expoGoSDKVersion: String?
  let platform: String
  let manifestPermalink: String
}

struct Snack: Identifiable, Codable, Equatable {
  let id: String
  let name: String
  let description: String?
  let fullName: String
  let slug: String
  let isDraft: Bool
  let sdkVersion: String
}

struct ProjectsListResponse: Codable {
  let data: ProjectsListData
}

struct ProjectsListData: Codable {
  let account: ProjectsListAccount
}

struct ProjectsListAccount: Codable {
  let byName: ProjectsListByName
}

struct ProjectsListByName: Codable {
  let id: String
  let name: String
  let apps: [App]
  let appCount: Int
}

struct ProjectDetailsResponse: Codable {
  let data: ProjectDetailsData
}

struct ProjectDetailsData: Codable {
  let app: AppContainer
}

struct AppContainer: Codable {
  let byId: ProjectDetail
}

struct ProjectDetail: Codable {
  let id: String
  let name: String
  let slug: String
  let fullName: String
  let ownerAccount: OwnerAccount
  let updateBranches: [BranchDetail]
}

struct BranchesListResponse: Codable {
  let data: BranchesListData
}

struct BranchesListData: Codable {
  let app: BranchesListApp
}

struct BranchesListApp: Codable {
  let byId: BranchesListProject
}

struct BranchesListProject: Codable {
  let id: String
  let name: String
  let updateBranches: [BranchDetail]
  let updateBranchesCount: Int
}

struct BranchDetailsResponse: Codable {
  let data: BranchDetailsData
}

struct BranchDetailsData: Codable {
  let app: BranchDetailsApp
}

struct BranchDetailsApp: Codable {
  let byId: BranchDetailsProject
}

struct BranchDetailsProject: Codable {
  let id: String
  let name: String
  let updateBranchByName: BranchDetail?
}

struct BranchDetail: Identifiable, Codable {
  let id: String
  let name: String
  let updates: [AppUpdate]
}

struct SnacksListResponse: Codable {
  let data: SnacksListData
}

struct SnacksListData: Codable {
  let account: SnacksListAccount
}

struct SnacksListAccount: Codable {
  let byName: SnacksListByName
}

struct SnacksListByName: Codable {
  let id: String
  let name: String
  let snacks: [Snack]
}

extension App {
  func toExpoProject() -> ExpoProject {
    let latestUpdateUrl = firstTwoBranches.first?.updates.first?.manifestPermalink

    return ExpoProject(
      id: id,
      name: name,
      fullName: fullName,
      description: nil,
      latestUpdateUrl: latestUpdateUrl,
      firstTwoBranches: firstTwoBranches
    )
  }
}
