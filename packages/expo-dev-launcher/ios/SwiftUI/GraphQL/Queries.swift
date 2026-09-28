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

  /// A single page of branches, along with the cursor needed to request the page after it.
  struct BranchesPage {
    let branches: [Branch]
    let endCursor: String?
    let hasNextPage: Bool
  }

  /// Fetches a page of branches, each with its newest update compatible with `runtimeVersion`.
  /// Pass `searchTerm` to have the server filter branches by name.
  static func getBranches(
    appId: String,
    first: Int,
    after: String?,
    searchTerm: String?,
    runtimeVersion: String,
    platform: String
  ) async throws -> BranchesPage {
    let query = """
    query getBranches(
      $appId: String!
      $first: Int!
      $after: String
      $filter: BranchFilterInput
      $runtimeVersion: String!
      $platform: AppPlatform!
    ) {
      app {
        byId(appId: $appId) {
          branchesPaginated(first: $first, after: $after, filter: $filter) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              cursor
              node {
                id
                name
                compatibleUpdates: updates(offset: 0, limit: 1, filter: { runtimeVersions: [$runtimeVersion], platform: $platform }) {
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
      }
    }
    """

    var variables: [String: Any] = [
      "appId": appId,
      "first": first,
      "runtimeVersion": runtimeVersion,
      "platform": platform
    ]

    if let after {
      variables["after"] = after
    }

    if let searchTerm {
      variables["filter"] = ["searchTerm": searchTerm]
    }

    let response: BranchesResponse = try await APIClient.shared.request(query, variables: variables)
    let connection = response.data.app.byId.branchesPaginated

    return BranchesPage(
      branches: connection.branches,
      endCursor: connection.pageInfo.endCursor,
      hasNextPage: connection.pageInfo.hasNextPage
    )
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
    offset: Int,
    limit: Int
  ) async throws -> [Update] {
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
      "limit": limit,
      "platform": platform
    ]

    let response: UpdatesResponse = try await APIClient.shared.request(query, variables: variables)

    return response.data.app.byId.updateBranchByName.updates
  }
}
