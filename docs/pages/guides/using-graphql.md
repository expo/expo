---
title: Using GraphQL
---

## Overview

[GraphQL](http://graphql.org/) is a _query language_ for APIs. It enables declarative data fetching and thus ties in perfectly with React/React Native as a declarative framework for building user interfaces. GraphQL can either complement or entirely replace the usage of REST APIs.

The main difference between REST and GraphQL is that RESTful APIs have _multiple endpoints_ that return _fixed data structures_ whereas a GraphQL server only exposes a _single endpoint_ and returns _flexible data structures_. This works because a client that needs data from the server also submits its precise data requirements in each request which allows the server to tailor the response exactly according to the client’s needs.

You can learn more about the differences between GraphQL and REST [here](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/). To get a high-level overview and understand more about the architectural use cases of GraphQL, take a look at [this](https://www.howtographql.com/basics/3-big-picture/) article.

GraphQL has a rapidly growing community. To stay up-to-date about everything that’s happening in the GraphQL ecosystem, check out these resources:

- [GraphQL Weekly](https://www.graphqlweekly.com/): Weekly newsletter about GraphQL
- [GraphQL Conf](https://www.graphql-europe.org/): One of the world's biggest GraphQL conferences

For an in-depth learning experience, visit the [How to GraphQL](https://www.howtographql.com/) fullstack tutorial website.

## Communicating with a GraphQL API

In this section, we’ll explain the core concepts you need to know when working with a GraphQL API.

### Fetching data with GraphQL queries

When an application needs to retrieve data from a GraphQL API, it has to send a _query_ to the server in which it specifies the data requirements. Most GraphQL servers accept only HTTP POST requests where the query is put into the _body_ of the request. Note however that GraphQL itself is actually _transport layer agnostic_, meaning that the client-server communication could also happen using other networking protocols than HTTP.

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

The keyword `query` in the beginning expresses the _operation type_. Besides `query`, there are two more operation types called `mutation` and `subscription`. Note that the default operation type of a request is in fact `query`, so you might as well remove it from the above request. `feed` is the _root field_ of the query and everything that follows is called the _selection set_ of the query.

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

The root of the returned JSON object is a field called `data` as defined in the official [GraphQL specification](http://spec.graphql.org/draft/#sec-Data). The rest of the JSON object then contains exactly the information that the client asked for in the query. If the client for example hadn’t included the `imageUrl` in the query’s selection set, the server wouldn’t have included it in its response either.

In case the GraphQL request fails for some reason, e.g. because the query was malformed, the server will not return the `data` field but instead return an array called `errors` with information about the failure. Notice that it can happen that the server returns both, `data` _and_ `errors` . This can occur when the server can only partially resolve a query, e.g. because the user requesting the data only had the access rights for specific parts of the query's payload.

### Creating, updating and deleting data with GraphQL mutations

Most of the time when working with an API, you’ll also want to make changes to the data that’s currently stored in the backend. In GraphQL, this is done using so-called _mutations_. A mutation follows the exact same syntactical structure as a query. In fact, it actually also _is_ a query in that it combines a write operation with a directly following read operation. Essentially, the idea of a mutation corresponds to the PUT, POST and DELETE calls that you would run against a REST API but additionally allows you to fetch data in a single request.

Let’s consider an example mutation to create a new post in our sample Instagram app:

```graphql
mutation {
  createPost(description: "Funny Birds", imageUrl: "http://example.org/birds.png") {
    id
  }
}
```

Instead of the `query` operation type, this time we’re using `mutation`. Then follows the _root field_, which in this case is called `createPost`. Notice that all fields can also take arguments, here we provide the post’s `description` and `imageUrl` so the server knows what it should write into the database. In the payload of the mutation we simply specify the `id` of the new post that will be generated on the server-side.

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

GraphQL has a [type system](http://graphql.org/learn/schema/#type-system) that’s used to define the capabilities of an API. These capabilities are written down in the GraphQL _schema_ using the syntax of the GraphQL [Schema Definition Language](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51) (SDL). Here’s what the `Post` type from our previous examples looks like:

```graphql
type Post {
  id: ID!
  description: String!
  imageUrl: String!
}
```

The syntax is pretty straightforward. We’re defining a type called `Post` that has three properties, in GraphQL terminology these properties are called _fields_. Each field has a _name_ and a _type_. The exclamation point following a type means that this field cannot be `null`.

### Root types are the entry points for the API

Each schema has so-called [root types](http://graphql.org/learn/schema/#the-query-and-mutation-types) that define the _entry points_ into the API. These are the root types that you can define in your schema:

- `Query`: Specifies all the queries a GraphQL server accepts
- `Mutation`: Specifies all the mutations a GraphQL server accepts
- `Subscription`: Specifies all the subscriptions a GraphQL server accepts (subscriptions are used for realtime functionality, learn more [here](http://graphql.org/blog/subscriptions-in-graphql-and-relay/))

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

Learn how to build a GraphQL server, check out this [tutorial](https://www.howtographql.com/graphql-js/0-introduction/).

## Next Steps & Resources

- **GraphQL server basics**: Check out this tutorial series about GraphQL servers:
  - [GraphQL Server Basics (Part 1): The Schema](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e)
  - [GraphQL Server Basics (Part 2): The Network Layer](https://blog.graph.cool/graphql-server-basics-the-network-layer-51d97d21861)
  - [GraphQL Server Basics (Part 3): Demystifying the info Argument in GraphQL Resolvers](https://blog.graph.cool/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a)
