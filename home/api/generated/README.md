## graphqlFragmentTypes.json

We auto-generate GraphQL type information about union and interface types since Apollo Client's heuristic for matching results to types does not have enough information to be accurate when fetching results that conform to a union or interface type. Instead, we pass information about our union and interface types to Apollo Client to inform its heuristic.

We auto-generate this information with generate-graphql-fragment-types.sh in this repository. Whenever we change a union or interface type on our GraphQL endpoint, we should re-run this script and commit the auto-generated JSON file.

See https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher for more information.
