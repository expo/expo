// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct Queries {
  static func getCurrentUser() -> String {
    return """
    query Home_CurrentActor {
      meActor {
        __typename
        id
        accounts {
          id
          name
          profileImageUrl
          ownerUserActor {
            id
            username
            primaryAccountProfileImageUrl
            firstName
            fullName
            lastName
          }
        }
        ... on UserActor {
          username
          firstName
          lastName
          primaryAccountProfileImageUrl
          bestContactEmail
        }
        ... on PartnerActor {
          username
        }
      }
    }
    """
  }

  static func getProjectsList() -> String {
    return """
    query Home_AccountApps($accountName: String!, $first: Int!, $after: String, $platform: AppPlatform!) {
      account {
        byName(accountName: $accountName) {
          id
          name
          appsPaginated(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
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
                    expoGoSDKVersion
                    platform
                    manifestPermalink
                  }
                }
              }
            }
          }
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
    query Home_AccountSnacks($accountName: String!, $first: Int!, $after: String) {
      account {
        byName(accountName: $accountName) {
          id
          name
          snacksPaginated(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
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
          appsPaginated(first: 5) {
            edges {
              node {
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
                    expoGoSDKVersion
                    platform
                    manifestPermalink
                  }
                }
              }
            }
          }
          snacksPaginated(first: 5) {
            edges {
              node {
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
