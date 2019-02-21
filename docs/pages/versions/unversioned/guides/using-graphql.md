---
title: Using GraphQL
---

## Overview

[GraphQL](http://graphql.org/) is a *query language* for APIs. It enables declarative data fetching and thus ties in perfectly with React/React Native as a declarative framework for building user interfaces. GraphQL can either complement or entirely replace the usage of REST APIs.

The main difference between REST and GraphQL is that RESTful APIs have *multiple endpoints* that return *fixed data structures* whereas a GraphQL server only exposes a *single endpoint* and returns *flexible data structures*. This works because a client that needs data from the server also submits its precise data requirements in each request which allows the server to tailor the response exactly according to the client’s needs.

You can learn more about the differences between GraphQL and REST [here](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/). To get a high-level overview and understand more about the architectural use cases of GraphQL, take a look at [this](https://www.howtographql.com/basics/3-big-picture/) article.

GraphQL has a rapidly growing community. To stay up-to-date about everything that’s happening in the GraphQL ecosystem, check out these resources:

* [GraphQL Weekly](https://www.graphqlweekly.com/): Weekly newsletter about GraphQL
* [GraphQL Radio](https://www.graphqlradio.com/): Podcast discussing real-world use cases of GraphQL
* [GraphQL Europe](https://www.graphql-europe.org/): Europe's biggest GraphQL conference
* [Prisma blog](https://blog.graph.cool/): Technical deep dives and tutorials all around GraphQL development

For an in-depth learning experience, visit the [How to GraphQL](https://www.howtographql.com/) fullstack tutorial website.

## Communicating with a GraphQL API

In this section, we’ll explain the core concepts you need to know when working with a GraphQL API.

### Fetching data with GraphQL queries

When an application needs to retrieve data from a GraphQL API, it has to send a _query_ to the server in which it specifies the data requirements. Most GraphQL servers accept only HTTP POST requests where the query is put into the *body* of the request. Note however that GraphQL itself is actually *transport layer agnostic*, meaning that the client-server communication could also happen using other networking protocols than HTTP.

Here’s an example query that a client might send in an Instagram-like application:

```graphql
query {
  feed {
    id
    imageUrl
    description
  }
}
```

The keyword `query` in the beginning expresses the *operation type*. Besides `query`, there are two more operation types called `mutation` and `subscription`. Note that the default operation type of a request is in fact `query`, so you might as well remove it from the above request. `feed` is the *root field* of the query and everything that follows is called the *selection set* of the query.

When a server receives the above query, it will [resolve](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e#1880) it, i.e. collect the required data, and package up the response in the same format of the query. Here’s what a potential response could look like:

```json
{
  "data": {
    "feed": [
      {
        "id": "1",
        "description": "Nice Sunset",
        "imageUrl": "http://example.org/sunset.png"
      },
      {
        "id": "2",
        "description": "Cute Cats",
        "imageUrl": "http://example.org/cats.png"
      }
    ]
  }
}
```

The root of the returned JSON object is a field called `data` as defined in the official [GraphQL specification](http://facebook.github.io/graphql/#sec-Data). The rest of the JSON object then contains exactly the information that the client asked for in the query. If the client for example hadn’t included the `imageUrl` in the query’s selection set, the server wouldn’t have included it in its response either.

In case the GraphQL request fails for some reason, e.g. because the query was malformed, the server will not return the `data` field but instead return an array called `errors` with information about the failure. Notice that it can happen that the server returns both, `data` *and* `errors` . This can occur when the server can only partially resolve a query, e.g. because the user requesting the data only had the access rights for specific parts of the query's payload.

### Creating, updating and deleting data with GraphQL mutations

Most of the time when working with an API, you’ll also want to make changes to the data that’s currently stored in the backend. In GraphQL, this is done using so-called *mutations*. A mutation follows the exact same syntactical structure as a query. In fact, it actually also *is* a query in that it combines a write operation with a directly following read operation.  Essentially, the idea of a mutation corresponds to the PUT, POST and DELETE calls that you would run against a REST API but additionally allows you to fetch data in a single request.

Let’s consider an example mutation to create a new post in our sample Instagram app:

```graphql
mutation {
  createPost(description: "Funny Birds", imageUrl: "http://example.org/birds.png") {
    id
  }
}
```

Instead of the `query` operation type, this time we’re using `mutation`. Then follows the *root field*, which in this case is called `createPost`. Notice that all fields can also take arguments, here we provide the post’s `description` and `imageUrl` so the server knows what it should write into the database. In the payload of the mutation we simply specify the `id` of the new post that will be generated on the server-side.

After the server created the new post in the database, it will return the following sample response to the client:

```json
{
  "data": {
    "createPost": {
        "id": "1"
      }
  }
}
```

## The GraphQL schema

In this section, we'll discuss the backbone of every GraphQL server: The GraphQL schema.

> For a technical deep dive all around the GraphQL schema, be sure to check out [this](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e) article.

### The Schema Definition Language (SDL)

GraphQL has a [type system](http://graphql.org/learn/schema/#type-system) that’s used to define the capabilities of an API. These capabilities are written down in the GraphQL *schema* using the syntax of the GraphQL [Schema Definition Language](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51) (SDL). Here’s what the `Post` type from our previous examples looks like:

```graphql
type Post {
  id: ID!
  description: String!
  imageUrl: String!
}
```

The syntax is pretty straightforward. We’re defining a type called `Post` that has three properties, in GraphQL terminology these properties are called _fields_. Each field has a *name* and a *type*. The exclamation point following a type means that this field cannot be `null`.

### Root types are the entry points for the API

Each schema has so-called [root types](http://graphql.org/learn/schema/#the-query-and-mutation-types) that define the *entry points* into the API. These are the root types that you can define in your schema:

* `Query`: Specifies all the queries a GraphQL server accepts
* `Mutation`: Specifies all the mutations a GraphQL server accepts
* `Subscription`: Specifies all the subscriptions a GraphQL server accepts (subscriptions are used for realtime functionality, learn more [here](http://graphql.org/blog/subscriptions-in-graphql-and-relay/))

To enable the `feed` query and `createPost` mutation that we saw in the previous examples, you’d have to write the root types as follows:

```graphql
type Query {
  feed: [Post!]!
}

type Mutation {
  createPost(description: String!, imageUrl: String!): Post
}
```

You can read more about the core GraphQL constructs [here](https://www.howtographql.com/basics/2-core-concepts/).

## Getting started with GraphQL

The first thing you need when getting started with GraphQL is of course a GraphQL server. As GraphQL itself is only a [specification](https://facebook.github.io/graphql/), you can either implement your own server using one of the available [reference implementations](http://graphql.org/code/#server-libraries) or take a shortcut by using a tool like [Apollo Launchpad](https://launchpad.graphql.com/).

The best way to get started with GraphQL in production is to use [`graphql-yoga`](https://github.com/graphcool/graphql-yoga), a flexible GraphQL server based on Express.js. `graphql-yoga` has a number of compelling features, such as support for [GraphQL Playground](https://github.com/graphcool/graphql-playground) and built-in GraphQL subscriptions for realtime functionality.

A great way to add a database to your GraphQL server is by using [Prisma](http://prismagraphql.com/). Prisma is an open-source GraphQL query engine that turns your database into a GraphQL API. Thanks to [Prisma bindings](https://github.com/graphcool/prisma-binding), it integrates nicely with your `graphql-yoga` server.

> To learn how to build a GraphQL server, check out this [tutorial](https://blog.graph.cool/tutorial-how-to-build-a-graphql-server-with-graphql-yoga-6da86f346e68) or watch this 4-min demo [video](https://www.youtube.com/watch?v=20zGexpEitc).

Since GraphQL servers are commonly implemented with HTTP, you can simply use `fetch` to get started and send queries and mutations to interact with the server. However, when working with GraphQL on the frontend, you’ll usually want to use a [GraphQL client](https://www.howtographql.com/advanced/0-clients/) library. GraphQL clients generally provide handy abstractions and allow you to directly send queries and mutations without having to worry about lower-level networking details.

There are four major GraphQL clients available at the moment:

* [Apollo Client](https://www.apollographql.com/client): Community-driven, flexible and powerful GraphQL client that’s easy to understand and has an intuitive API.
* [Relay](https://facebook.github.io/relay/): Facebook’s homegrown GraphQL client that’s heavily optimized for performance and comes with a notable learning curve.
* [Urql](https://github.com/FormidableLabs/urql): Simple GraphQL client for React.
* [graphql-request](https://github.com/graphcool/graphql-request): Simple and lightweight GraphQL client that works in all JavaScript environments and can be used for simple use cases like scripting.

Apollo, Relay and Urql implement further features like caching, realtime support with GraphQL subscriptions or optimistic UI updates.

Learn how to integrate with Auth0 social providers in the [expo-auth0-example](https://github.com/graphcool-examples/react-native-graphql/tree/master/authentication-with-expo-and-auth0) repository.

### Creating your own GraphQL server

The fastest way to get started with GraphQL is by using a [GraphQL boilerplate](https://github.com/graphql-boilerplates) project for the technology of your choice. GraphQL boilerplates provide the ideal starter kits for your GraphQL-based projects - no matter if backend-only or fullstack.

To get started, you can use the `graphql create` command (which is similar to `create-react-native-app`).

First, you need to install the [GraphQL CLI](https://github.com/graphql-cli/graphql-cli):

```sh
npm install -g graphql-cli
```

With the CLI installed, you can run the following command:

```sh
graphql create myapp
```

This will prompt you a list of the available boilerplates. Each technology has a `minimal`, a `basic` and an `advanced` version.

Choose `minimal` to learn what the most minimal version of a GraphQL server looks like. `basic` boilerplates come with an integrated database (based on Prisma). Finally, the `advanced` boilerplates additionally come with built-in authentication functionality for your users as well as support for realtime subscriptions.

To skip the interactive prompt, you can also pass the `--boilerplate` (short: `-b`) flag to the `graphql create` command and specify which starter kit you'd like to use. For example:

```sh
graphql create myapp --boilerplate node-advanced # The `advanced` boilerplate for Node.js
# or
graphql create myapp --boilerplate react-fullstack-basic # The `basic` boilerplate for a fullstack React app
```

## Running a practical example with React, Apollo & GraphQL

If you want to get your hands dirty and learn how to get started with a practical example, check out the [basic](https://github.com/graphql-boilerplates/react-fullstack-graphql/tree/master/basic) boilerplate for a fullstack React application.

> **Note** There are currently no boilerplate projects for React Native. However, all the code that's used to interact with the GraphQL API from within the React app can be applied in a React Native application in an identical manner!

Run `graphql create` and specify `react-fullstack-basic` as your target boilerplate:

```sh
graphql create myapp --boilerplate react-fullstack-basic
```

The GraphQL CLI will now fetch the code from the corresponding [GitHub repository](https://github.com/graphql-boilerplates/react-fullstack-graphql/) and run an install [script](https://github.com/graphql-boilerplates/react-fullstack-graphql/blob/master/basic/.install/index.js) to configure everything that's required.

After having downloaded the code from the repo, the CLI will prompt you to choose where you want to deploy your Prisma database service. To get started quickly, select one of the _development clusters_ (`prisma-eu1` or `prisma-us1`). If you have [Docker](https://www.docker.com/) installed, you can also deploy locally.

The install script will use the generated endpoint for the Prisma service and connect the GraphQL server with it by insterting it into `src/server/index.js`.

Once the command has finished, you first need to start the server and second start the React app:

```sh
cd myapp/server
yarn start
# the server is now running on http://localhost:4000;
# to continue, open a new tab in your terminal
# and navigate back to the root directory
cd ..
yarn start
```

The React app is now running on `http://localhost:3000` (the GraphQL server is running on `http://localhost:4000`).

> To learn about the queries and mutations accepted by the GraphQL API, check out the GraphQL schema that's stored in `server/src/schema.graphql`.

As an example, here is how the `FeedQuery` component is implemented that displays a list of `Post` elements:

```js
import React from 'react'
import Post from '../components/Post'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class FeedPage extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (this.props.location.key !== nextProps.location.key) {
      this.props.feedQuery.refetch()
    }
  }

  render() {
    if (this.props.feedQuery.loading) {
      return (
        <div className="flex w-100 h-100 items-center justify-center pt7">
          <div>Loading (from {process.env.REACT_APP_GRAPHQL_ENDPOINT})</div>
        </div>
      )
    }

    return (
      <React.Fragment>
        <h1>Feed</h1>
        {this.props.feedQuery.feed &&
          this.props.feedQuery.feed.map(post => (
            <Post
              key={post.id}
              post={post}
              refresh={() => this.props.feedQuery.refetch()}
              isDraft={!post.isPublished}
            />
          ))}
        {this.props.children}
      </React.Fragment>
    )
  }
}

const FEED_QUERY = gql`
  query FeedQuery {
    feed {
      id
      text
      title
      isPublished
    }
  }
`

export default graphql(FEED_QUERY, {
  name: 'feedQuery', // name of the injected prop: this.props.feedQuery...
  options: {
    fetchPolicy: 'network-only',
  },
})(FeedPage)
```

A mutation to create new `Post` elements in performed in the `CreatePage` component:

```js
import React from 'react'
import { withRouter } from 'react-router-dom'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class CreatePage extends React.Component {
  state = {
    title: '',
    text: '',
  }

  render() {
    return (
      <div className="pa4 flex justify-center bg-white">
        <form onSubmit={this.handlePost}>
          <h1>Create Draft</h1>
          <input
            autoFocus
            className="w-100 pa2 mv2 br2 b--black-20 bw1"
            onChange={e => this.setState({ title: e.target.value })}
            placeholder="Title"
            type="text"
            value={this.state.title}
          />
          <textarea
            className="db w-100 ba bw1 b--black-20 pa2 br2 mb2"
            cols={50}
            onChange={e => this.setState({ text: e.target.value })}
            placeholder="Content"
            rows={8}
            value={this.state.text}
          />
          <input
            className={`pa3 bg-black-10 bn ${this.state.text &&
              this.state.title &&
              'dim pointer'}`}
            disabled={!this.state.text || !this.state.title}
            type="submit"
            value="Create"
          />{' '}
          <a className="f6 pointer" onClick={this.props.history.goBack}>
            or cancel
          </a>
        </form>
      </div>
    )
  }

  handlePost = async e => {
    e.preventDefault()
    const { title, text } = this.state
    await this.props.createDraftMutation({
      variables: { title, text },
    })
    this.props.history.replace('/drafts')
  }
}

const CREATE_DRAFT_MUTATION = gql`
  mutation CreateDraftMutation($title: String!, $text: String!) {
    createDraft(title: $title, text: $text) {
      id
      title
      text
    }
  }
`

const CreatePageWithMutation = graphql(CREATE_DRAFT_MUTATION, {
  name: 'createDraftMutation', // name of the injected prop: this.props.createDraftMutation...
})(CreatePage)

export default withRouter(CreatePageWithMutation)
```

## Next Steps & Resources

* **GraphQL server basics**: Check out this tutorial series about GraphQL servers:
  * [GraphQL Server Basics (Part 1): The Schema](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e)
  * [GraphQL Server Basics (Part 2): The Network Layer](https://blog.graph.cool/graphql-server-basics-the-network-layer-51d97d21861)
  * [GraphQL Server Basics (Part 3): Demystifying the info Argument in GraphQL Resolvers](https://blog.graph.cool/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a)
  * [Tutorial: How to build a GraphQL server with graphql-yoga](https://blog.graph.cool/tutorial-how-to-build-a-graphql-server-with-graphql-yoga-6da86f346e68)
* **Server deployment**: You can deploy your GraphQL servers to the web using [Now](https://blog.graph.cool/deploying-graphql-servers-with-zeit-now-85f4757b79a7) or [Up](https://blog.graph.cool/deploying-graphql-servers-with-apex-up-522f2b75a2ac)
* **Prisma database service**: Learn more about the ideas behind Prisma and best practices for building GraphQL servers [here](https://www.prismagraphql.com/docs/reference/introduction/what-is-prisma-apohpae9ju)
