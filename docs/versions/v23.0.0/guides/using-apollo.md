---
title: Using Apollo
---

The [Apollo](http://www.apollodata.com/) client enables you to use [GraphQL](http://graphql.org/) in your Expo applications. Unlike other GraphQL clients, Apollo works out of the box with Expo.

## Why GraphQL?

GraphQL is a query language for your API designed and released by Facebook. The reason why GraphQL is interesting to so many developers is that it improves upon critiques of other API architectures like SOAP and REST.

For instance, with a GraphQL query you are guaranteed to only ever get the _exact data you need_. No more overfetching or underfetching from API endpoints. Not only does a GraphQL query allow you to get exactly the data you need, but it also allows you to do so in one request.

To learn more about GraphQL see [graphql.org](http://graphql.org/).

## Why Apollo?

Apollo is not the only library designed to help you manage your API data. However, the principles which Apollo was designed around make it a powerful yet still flexible choice. The client is universally compatible with any JavaScript environment or framework. So the same code you use in your Expo app may also be used in your web app regardless of the framework. Apollo also integrates cleanly into popular development tools like Redux, and may be easily extended to fit your apps specific needs. Most important though is that the Apollo client is community driven with all development happening in the open.

The Apollo client does way more then run your queries. To learn more about the advantages of using Apollo client see [dev.apollodata.com/react](http://dev.apollodata.com/react/).

## 1. Installing Apollo Client

To get started with Apollo and Expo, install the [apollo-client](http://npmjs.com/apollo-client) npm package, the [react-apollo](https://www.npmjs.com/package/react-apollo) React integration package, and the [graphql-tag](https://www.npmjs.com/package/graphql-tag) library for constructing query documents.

```javascript
npm install apollo-client react-apollo graphql-tag --save
```

These packages are modular building blocks that can be used independently in other environments.

## 2. Client Setup

To start using Apollo we need to create an `ApolloClient` and serve that client to our React application with an `ApolloProvider`. The `ApolloClient` is what controls all your GraphQL data and the `ApolloProvider` wires the client into your React component hierarchy.

### Creating a client

Initialize an instance of the `ApolloClient` imported from the [apollo-client](http://npmjs.com/apollo-client) package and provide the client with a `networkInterface` that points to your GraphQL API.

```javascript
import ApolloClient, { createNetworkInterface } from 'apollo-client';

// Replace http://my-api.graphql.com with your GraphQL API’s URL.
const client = new ApolloClient({
  networkInterface: createNetworkInterface({ uri: 'http://api.example.com/graphql' }),
});
```

### Creating a provider

Next you will want to connect your client to the rest of your React app with `ApolloProvider` from the [react-apollo](https://www.npmjs.com/package/react-apollo) package. This is similar to how the `Provider` component works in `react-redux`.

```javascript
import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';

// Your client from the last step.
const client = new ApolloClient({ /* ... */ });

class App extends React.Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <View>
          <Text>Hello, Expo!</Text>
        </View>
      </ApolloProvider>
    );
  }
}
```

## 3. Connecting data to a component

All that is left to do is connect data from your GraphQL API to a React component where you can render your data to a user. To do this you can use the `graphql` function from the [react-apollo](https://www.npmjs.com/package/react-apollo) package to create a higher order component.

To learn more about the `graphql` and `gql` functions used below read the Apollo documentation on [connecting data](http://dev.apollodata.com/react/higher-order-components.html).

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

// The data prop, which is provided by the wrapper below contains,
// a `loading` key while the query is in flight and posts when ready
function PostList({ data: { loading, posts } }) {
  if (loading) {
    return <Text>Loading</Text>;
  } else {
    return (
      <View>
        {posts.sort((x, y) => y.votes - x.votes).map(post => (
          <View key={post.id}>
            <Text>{post.title}</Text>
            <Text>
              by {post.author.firstName} {' '}
              {post.author.lastName} {' '}
            </Text>
            <Text>{post.votes} votes</Text>
          </View>
        ))}
      </View>
    );
  }
}

// The `graphql` wrapper executes a GraphQL query and makes the results
// available on the `data` prop of the wrapped component (PostList here)
export default graphql(gql`
  query allPosts {
    posts {
      id
      title
      votes
      author {
        id
        firstName
        lastName
      }
    }
  }
`)(PostList);
```

You are now ready to use GraphQL in your Expo app. For an in-depth tutorial read the [Learn Apollo Expo guide](https://www.learnapollo.com/tutorial-react-native-exponent/rne-01) which will walk you through the process of building a Pokédex Expo app with Apollo. To learn how to do mutations, subscriptions, pagination, optimistic UI, and more go to the Apollo React documentation at [dev.apollodata.com/react](http://dev.apollodata.com/react/). Everything you learn there will work out of the box with Expo and React Native.

There are some Apollo examples written in React Native that you may wish to refer to. All the code should work equally well with Expo.

1.  The [“Hello World” example](https://github.com/apollostack/frontpage-react-native-app) used at dev.apollodata.com.
2.  A [GitHub API Example](https://github.com/apollostack/GitHub-GraphQL-API-Example) built to work with GitHub’s new GraphQL API.
