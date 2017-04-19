---
title: Using GraphQL
---

[GraphQL](www.graphql.org) is an API design paradigm that was introduced by Facebook in 2015 and is an efficient alternative to today's de-facto standard REST.

## Why GraphQL?

GraphQL has a number of advantages in terms of flexilibilty and performance compared to REST and other approaches.

For instance, with a GraphQL query you are guaranteed to only ever get the exact data you need. No more overfetching or underfetching from API endpoints. Not only does a GraphQL query allow you to get exactly the data you need, but it also allows you to do so in a single request.

## How to get started with GraphQL?

GraphQL has only been released as a _specification_, that means that you can go and implement a GraphQL **server** yourself in any server-side language of your choice!

In order to use GraphQL from an application, you will also need a **client** that is responsible for the interaction with the GraphQL server.

### GraphQL Backend

Building your own **GraphQL server** from scratch however is not trivial and potentially gets really complicated once you want to implement more advanced features like proper _permissions_, _filtering_ or _subscriptions_ (which are a GraphQL feature that allow your app to get real-time updates from the database).

If you don't want to build the backend yourself, you can use [**Graphcool**](https://www.graph.cool), a powerful and flexible backend platform that combines GraphQL with AWS Lambda to provide you with the means of setting up a fully-fledged GraphQL server in only a few minutes.

### GraphQL Client

Same goes for the **GraphQL client**, it is of course possible for you to write the client that is responsible for interacting with a GraphQL backend yourself.

But if you want to save time, you can use [**Apollo**](http://dev.apollodata.com/), a ready-made GraphQL client that integrates easily with React Native as well as with any other frontend technology of your choice. This means that you could reuse the code from your Expo app in your web app regardless of the framework. Apollo also integrates cleanly into popular development tools like Redux, and may be easily extended to fit your apps specific needs. Most important though is that the Apollo client is community driven with all development happening in the open.

Using the Apollo client, you can benefit from _caching_, _optimistic UI_, _subscriptions_ and a lot more. To learn more, visit [dev.apollodata.com/react](http://dev.apollodata.com/react/).

### Learn more

In the following, we'll explain how to set up a GraphQL project using these two technologies. For an in-depth tutorial on how to use Graphcool with the Apollo client, visit the [Learn Apollo Expo Guide](https://www.learnapollo.com/tutorial-react-native-exponent/rne-01/).

We also prepared a full **Instagram example that uses Graphcool, Apollo and Auth0** - you can check it out [here](https://github.com/graphcool-examples/exponent-auth0-instagram-example).

## Setting up a Graphcool backend

### Connecting to Graphcool

After [creating a Graphcool account](https://console.graph.cool/signup) you can create a new project and define your data model. Once you're done with that, you can start using the backend with the provided endpoint.

If you want to use the Apollo client, you will need the endpoint for Graphcool's [**Simple API**](https://www.graph.cool/docs/reference/simple-api/overview-heshoov3ai):

<img src="http://imgur.com/ZdH5iE2.png" height="450">

We will tell you how to set up the Apollo client in a bit.

### Storing and Fetching Data

When you are done setting up your data model, it's time to start querying your data. A flexible GraphQL API is automatically generated for you and you can explore its query capabilities in a GraphQL playground.

> Note: You can either use the playground that is available directly in the [GraphQL console](https://console.graph.cool) or copy the endpoint into the address bar of your browser if you want to work with it separately. The **autocompletion feature** of the playground is a fantastic tool that helps you to build exactly the queries you need.

<img src="http://i.imgur.com/dSGk5u4.png" height="450">

In an Instagram-like app, you could query all _posts_ using a _query_ that looks as follows:

```graphql
query {
  allPosts {
    description
    imageUrl
    author {
      name
    }
  }
}
```

To create a new _post_ in the Graphcool database, you could send a _mutation_ such as this one:

```graphql
mutation {
  createPost(
    description: "A parrot",
    imageUrl: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890"
  ) {
    id
  }
}
```

If you just want to play around with a GraphQL endpoint but are too lazy to setup a project yourself, you can use [this playground](https://api.graph.cool/simple/v1/ciwce5xw82kh7017179gwzn7q?query=query%20%7B%0A%20%20allPosts%20%7B%0A%20%20%20%20imageUrl%0A%20%20%20%20comments%20%7B%0A%20%20%20%20%20%20text%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D) that we prepared for you (note that _mutations_ are disabled here).

### User Authentication with Auth0

Graphcool comes with different [authentication integrations](https://blog.graph.cool/user-authentication-in-graphql-with-auth0-digits-4ce01788950#.61e3zh7x4) out of the box. The [Auth0 integration](https://www.graph.cool/docs/reference/platform/integrations/auth0-naed3eecie) works nicely together with the OAuth workflow available in Expo.

#### Authenticating as a User

Users can authenticate a GraphQL request by supplying a valid [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token) in the `Authorization` header. If a valid token is passed as the Authorization header, you can query information on the logged-in user using the ready-made user query:

```graphql
query {
  user {
    id
    name
  }
}
```

This query returns the `id` and `name` of the user if they are already authenticated, that is if a token is available.

#### User Sign Up

Signing up users is handled using the `createUser` mutation. With the Auth0 integration, you could run this mutation in order to create a new user in the Graphcool database:

```graphql
mutation ($idToken: String!, $name: String!) {
  createUser(authProvider: {auth0: {idToken: $idToken}, name: $name) {
    id
  }
}
```

#### Social OAuth Authentication providers

Learn how to integrate with Auth0 social providers in the [exponent-auth0-example](https://github.com/graphcool-examples/exponent-auth0-instagram-example) repository.

### Permissions

The permission system at Graphcool complements the employed user authentication nicely. You can control read and write access on a model or field level.

For example, if you want to express that only authenticated users can create posts you can enable the create data operation for the `Post` model with `AUTHENTICATED` permission level.

Using so called permission queries, you can even go one step further and describe arbitrary relations between the authenticated user and the manipulated node. For example, you can only allow authenticated users to delete their own posts but not the posts of other users.

## Using the Apollo client

### Installing Apollo Client

To get started with Apollo and Expo, install the [apollo-client](http://npmjs.com/apollo-client) npm package, the [react-apollo](http://npmjs.com/apollo-client) React integration package, and the [graphql-tag](https://www.npmjs.com/package/graphql-tag) library for constructing query documents.

```sh
npm install apollo-client react-apollo graphql-tag --save
```

These packages are modular building blocks that can be used independently in other environments.

### Client Setup

To start using Apollo we need to create an `ApolloClient` and serve that client to our React application with an `ApolloProvider`. The `ApolloClient` is what controls all your GraphQL data and the `ApolloProvider` wires the client into your React component hierarchy.

#### Creating a client

Initialize an instance of the ApolloClient imported from the apollo-client package and provide the client with a networkInterface that points to your GraphQL API.

```javascript
import ApolloClient, { createNetworkInterface } from 'apollo-client';

// Replace http://my-api.graphql.com with your GraphQL API’s URL.
const client = new ApolloClient({
  networkInterface: createNetworkInterface({ uri: 'http://api.example.com/graphql' }),
});
```

#### Creating a provider

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

### Connecting data to a component

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

There are some Apollo examples written in React Native that you may wish to refer to. All the code should work equally well with Expo.

1.  The [“Hello World” example](https://github.com/apollostack/frontpage-react-native-app) used at [dev.apolldata.com](dev.apolldata.com).
2.  A [GitHub API Example](https://github.com/apollostack/GitHub-GraphQL-API-Example) built to work with GitHub’s new GraphQL API.

You are now ready to use GraphQL in your Expo app 🚀
