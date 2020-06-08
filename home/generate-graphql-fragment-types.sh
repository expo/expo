#!/bin/bash

set -euo pipefail

script_dir=$(dirname "$0")

# See https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher
introspection_query="  \
{                      \
  __schema {           \
    types {            \
      kind             \
      name             \
      possibleTypes {  \
        name           \
      }                \
    }                  \
  }                    \
}                      \
"

echo "Querying GraphQL endpoint for type information..."
all_types=$(
  curl --silent \
    --request POST \
    --header 'content-type: application/json' \
    --data "{ \"query\": \"$introspection_query\" }" \
    https://exp.host/--/graphql
)

echo "Filtering for union or interface types..."
unions_and_interfaces=$(
  echo "$all_types" | \
  jq ".data | .__schema.types |= map(select(.possibleTypes != null))"
)

json_path="$script_dir/api/generated/graphqlFragmentTypes.json"
echo "$unions_and_interfaces" > "$json_path"
echo "Saved union and interface types to $json_path"
