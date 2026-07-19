// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct User: Codable {
  let id: String
  let appCount: Int?
  let username: String
  let profilePhoto: String?
  let accounts: [UserAccount]
  let isExpoAdmin: Bool
}

struct UserAccount: Codable {
  let id: String
  let name: String
  let ownerUserActor: OwnerUserActor?
}

struct OwnerUserActor: Codable {
  let username: String
  let fullName: String?
  let profilePhoto: String?
}

struct MeUserActorResponse: Codable {
  let data: MeUserActorData
}

struct MeUserActorData: Codable {
  let meUserActor: User
}

struct Branch: Codable {
  let id: String
  let name: String
  let compatibleUpdates: [CompatibleUpdate]
}

struct CompatibleUpdate: Codable {
  let id: String
}

struct BranchesResponse: Codable {
  let data: BranchesData
}

struct BranchesData: Codable {
  let app: AppWithBranches
}

struct AppWithBranches: Codable {
  let byId: ProjectWithBranches
}

struct ProjectWithBranches: Codable {
  let updateBranches: [Branch]
}

struct Channel: Codable {
  let name: String
  let branches: [String]
}

struct ChannelResponse: Codable {
  let data: ChannelData
}

struct ChannelData: Codable {
  let app: AppWithChannels
}

struct AppWithChannels: Codable {
  let byId: ProjectWithChannels
}

struct ProjectWithChannels: Codable {
  let updateChannels: [UpdateChannel]
}

struct UpdateChannel: Codable {
  let name: String
  let updateBranches: [UpdateBranch]
}

struct UpdateBranch: Codable {
  let name: String
}

struct Update: Codable {
  let id: String
  let message: String
  let runtimeVersion: String
  let createdAt: String
  let manifestPermalink: String
}

struct UpdatesResponse: Codable {
  let data: UpdatesData
}

struct UpdatesData: Codable {
  let app: AppWithUpdates
}

struct AppWithUpdates: Codable {
  let byId: ProjectWithUpdates
}

struct ProjectWithUpdates: Codable {
  let updateBranchByName: UpdateBranchWithUpdates
}

struct UpdateBranchWithUpdates: Codable {
  let updates: [Update]
}
