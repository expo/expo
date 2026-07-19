// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class Queries {
  static func getUserProfile() async throws -> User {
    let query = """
    {
      meUserActor {
        id
        appCount
        profilePhoto
        username
        isExpoAdmin
        accounts {
          id
          name
          ownerUserActor {
            username
            fullName
            profilePhoto
          }
        }
      }
    }
    """

    let response: MeUserActorResponse = try await APIClient.shared.request(query)
    return response.data.meUserActor
  }

  static func getBranches(
    appId: String,
    offset: Int,
    limit: Int,
    runtimeVersion: String,
    platform: String
  ) async throws -> [Branch] {
    let query = """
    query getBranches($appId: String!, $offset: Int!, $limit: Int!, $runtimeVersion: String!, $platform: AppPlatform!) {
      app {
        byId(appId: $appId) {
          updateBranches(offset: $offset, limit: $limit) {
            id
            name
            compatibleUpdates: updates(offset: 0, limit: 1, filter: { runtimeVersions: [$runtimeVersion], platform: $platform }) {
              id
            }
          }
        }
      }
    }
    """

    let variables: [String: Any] = [
      "appId": appId,
      "offset": offset,
      "limit": limit,
      "runtimeVersion": runtimeVersion,
      "platform": platform
    ]

    let response: BranchesResponse = try await APIClient.shared.request(query, variables: variables)
    return response.data.app.byId.updateBranches
  }

  static func getChannels(appId: String) async throws -> [Channel] {
    let query = """
    query getUpdates($appId: String!) {
      app {
        byId(appId: $appId) {
          updateChannels(offset: 0, limit: 10) {
            name
            updateBranches(offset: 0, limit: 10) {
              name
            }
          }
        }
      }
    }
    """

    let variables: [String: Any] = [
      "appId": appId
    ]

    let response: ChannelResponse = try await APIClient.shared.request(query, variables: variables)

    return response.data.app.byId.updateChannels.map { updateChannel in
      Channel(
        name: updateChannel.name,
        branches: updateChannel.updateBranches.map { $0.name }
      )
    }
  }

  static func getUpdatesForBranch(
    appId: String,
    branchName: String,
    page: Int,
    pageSize: Int
  ) async throws -> (updates: [Update], page: Int) {
    let offset = (page - 1) * pageSize
    let platform = "IOS"

    let query = """
    query getUpdates(
      $appId: String!
      $branchName: String!
      $offset: Int!
      $limit: Int!
      $platform: AppPlatform!
    ) {
      app {
        byId(appId: $appId) {
          updateBranchByName(name: $branchName) {
            updates(offset: $offset, limit: $limit, filter: { platform: $platform }) {
              id
              message
              runtimeVersion
              createdAt
              manifestPermalink
            }
          }
        }
      }
    }
    """

    let variables: [String: Any] = [
      "appId": appId,
      "branchName": branchName,
      "offset": offset,
      "limit": pageSize,
      "platform": platform
    ]

    let response: UpdatesResponse = try await APIClient.shared.request(query, variables: variables)

    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"

    let outputFormatter = DateFormatter()
    outputFormatter.dateFormat = "MMMM d, yyyy, h:mma"

    let updates = response.data.app.byId.updateBranchByName.updates

    return (updates: updates, page: page)
  }
}
