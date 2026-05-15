// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct Queries {
  static func getCurrentUser() -> String {
    return """
    query Home_CurrentUserActor {
      meUserActor {
        __typename
        id
        username
        firstName
        lastName
        profilePhoto
        bestContactEmail
        accounts {
          id
          name
          profileImageUrl
          ownerUserActor {
            id
            username
            profilePhoto
            firstName
            fullName
            lastName
          }
        }
      }
    }
    """
  }

  static func getProjectsList() -> String {
    return """
    query Home_AccountApps($accountName: String!, $limit: Int!, $offset: Int!, $platform: AppPlatform!) {
      account {
        byName(accountName: $accountName) {
          id
          name
          apps(limit: $limit, offset: $offset, includeUnpublished: true) {
            id
            name
            fullName
            ownerAccount {
              name
            }
            firstTwoBranches: updateBranches(limit: 2, offset: 0) {
              id
              name
              updates(limit: 1, offset: 0, filter: { platform: $platform }) {
                id
                group
                message
                createdAt
                runtimeVersion
                expoGoSDKVersion
                platform
                manifestPermalink
              }
            }
          }
          appCount
        }
      }
    }
    """
  }

  // MARK: - Project Details Query

  static func getProjectDetails() -> String {
    return """
    query ProjectsQuery($appId: String!, $platform: AppPlatform!) {
      app {
        byId(appId: $appId) {
          id
          name
          slug
          fullName
          ownerAccount {
            name
          }
          updateBranches(limit: 100, offset: 0) {
            id
            name
            updates(limit: 1, offset: 0, filter: { platform: $platform }) {
              id
              group
              message
              createdAt
              runtimeVersion
              expoGoSDKVersion
              platform
              manifestPermalink
            }
          }
        }
      }
    }
    """
  }

  static func getSnacksList() -> String {
    return """
    query Home_AccountSnacks($accountName: String!, $limit: Int!, $offset: Int!) {
      account {
        byName(accountName: $accountName) {
          id
          name
          snacks(limit: $limit, offset: $offset) {
            id
            name
            description
            fullName
            slug
            isDraft
            sdkVersion
          }
        }
      }
    }
    """
  }

  static func getHomeScreenData() -> String {
    return """
    query HomeScreenData($accountName: String!, $platform: AppPlatform!) {
      account {
        byName(accountName: $accountName) {
          id
          name
          ownerUserActor {
            __typename
            id
            username
            firstName
            lastName
            profilePhoto
            bestContactEmail
            accounts {
              id
              name
              profileImageUrl
              ownerUserActor {
                id
                username
                profilePhoto
                firstName
                fullName
                lastName
              }
            }
          }
          apps(limit: 5, offset: 0, includeUnpublished: true) {
            id
            name
            fullName
            ownerAccount {
              name
            }
            firstTwoBranches: updateBranches(limit: 2, offset: 0) {
              id
              name
              updates(limit: 1, offset: 0, filter: { platform: $platform }) {
                id
                group
                message
                createdAt
                runtimeVersion
                expoGoSDKVersion
                platform
                manifestPermalink
              }
            }
          }
          snacks(limit: 5, offset: 0) {
            id
            name
            description
            fullName
            slug
            isDraft
            sdkVersion
          }
          appCount
        }
      }
    }
    """
  }

  static func getBranchesList() -> String {
    return """
    query BranchesListQuery($appId: String!, $limit: Int!, $offset: Int!, $platform: AppPlatform!) {
      app {
        byId(appId: $appId) {
          id
          name
          updateBranches(limit: $limit, offset: $offset) {
            id
            name
            updates(limit: 1, offset: 0, filter: { platform: $platform }) {
              id
              group
              message
              createdAt
              runtimeVersion
              expoGoSDKVersion
              platform
              manifestPermalink
            }
          }
          updateBranchesCount
        }
      }
    }
    """
  }

  static func getBranchDetails() -> String {
    return """
    query BranchDetailsQuery($appId: String!, $branchName: String!, $platform: AppPlatform!) {
      app {
        byId(appId: $appId) {
          id
          name
          updateBranchByName(name: $branchName) {
            id
            name
            updates(limit: 25, offset: 0, filter: { platform: $platform }) {
              id
              group
              message
              createdAt
              runtimeVersion
              expoGoSDKVersion
              platform
              manifestPermalink
            }
          }
        }
      }
    }
    """
  }
}
