.. _using-apollo:

Using Apollo
============

The `Apollo <http://www.apollodata.com/>`_ client enables you to use
`GraphQL <http://graphql.org/>`_ in your Exponent applications. Unlike other
GraphQL clients, Apollo works out of the box with Exponent.

Why GraphQL?
^^^^^^^^^^^^

GraphQL is a query language for your API designed and released by Facebook. The
reason why GraphQL is interesting to so many developers is that it improves upon
critiques of other API architectures like SOAP and REST.

For instance, with a GraphQL query you are guaranteed to only ever get the
*exact data you need*. No more overfetching or underfetching from API endpoints.
Not only does a GraphQL query allow you to get exactly the data you need, but it
also allows you to do so in one request.

To learn more about GraphQL see `graphql.org <http://graphql.org/>`_.

Why Apollo?
^^^^^^^^^^^

Apollo is not the only library designed to help you manage your API data.
However, the principles which Apollo was designed around make it a powerful yet
still flexible choice. The client is universally compatible with any JavaScript
environment or framework. So the same code you use in your Exponent app may
also be used in your web app regardless of the framework. Apollo also integrates
cleanly into popular development tools like Redux, and may be easily extended to
fit your apps specific needs. Most important though is that the Apollo client is
community driven with all development happening in the open.

The Apollo client does way more then run your queries. To learn more about the
advantages of using Apollo client see
`dev.apollodata.com/react <http://dev.apollodata.com/react/>`_.

1. Installing Apollo Client
^^^^^^^^^^^^^^^^^^^^^^^^^^^

To get started with Apollo and Exponent, install the
`apollo-client <http://npmjs.com/apollo-client>`_ npm package, the
`react-apollo <https://www.npmjs.com/package/react-apollo>`_ React integration
package, and the `graphql-tag <https://www.npmjs.com/package/graphql-tag>`_
library for constructing query documents.

.. code-block:: bash

   npm install apollo-client react-apollo graphql-tag --save

These packages are modular building blocks that can be used independently in
other environments.

2. Client Setup
^^^^^^^^^^^^^^^

To start using Apollo we need to create an ``ApolloClient`` and serve that
client to our React application with an ``ApolloProvider``. The ``ApolloClient``
is what controls all your GraphQL data and the ``ApolloProvider`` wires the
client into your React component hierarchy.

Creating a client
"""""""""""""""""

Initialize an instance of the ``ApolloClient`` imported from the
`apollo-client <http://npmjs.com/apollo-client>`_ package and provide the client
with a ``networkInterface`` that points to your GraphQL API.

.. code-block:: javascript

    import ApolloClient, { createNetworkInterface } from 'apollo-client';

    // Replace http://my-api.graphql.com with your GraphQL API’s URL.
    const client = new ApolloClient({
      networkInterface: createNetworkInterface({ uri: 'http://api.example.com/graphql' }),
    });

Creating a provider
"""""""""""""""""""

Next you will want to connect your client to the rest of your React app with
``ApolloProvider`` from the
`react-apollo <https://www.npmjs.com/package/react-apollo>`_ package. This is
similar to how the ``Provider`` component works in ``react-redux``.

.. code-block:: javascript

    import ApolloClient from 'apollo-client';
    import { ApolloProvider } from 'react-apollo';

    // Your client from the last step.
    const client = new ApolloClient({ ... });

    class App extends React.Component {
      render() {
        return (
          <ApolloProvider client={client}>
            <View>
              <Text>Hello, Exponent!</Text>
            </View>
          </ApolloProvider>
        );
      }
    }

3. Connecting data to a component
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

All that is left to do is connect data from your GraphQL API to a React
component where you can render your data to a user. To do this you can use the
``graphql`` function from the
`react-apollo <https://www.npmjs.com/package/react-apollo>`_ package to
create a higher order component.

To learn more about the ``graphql`` and ``gql`` functions used below read the
Apollo documentation on
`connecting data <http://dev.apollodata.com/react/higher-order-components.html>`_.

.. code-block:: javascript

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

You are now ready to use GraphQL in your Exponent app. For an in-depth tutorial
read the
`Learn Apollo Exponent guide <https://www.learnapollo.com/tutorial-react-native-exponent/rne-01>`_
which will walk you through the process of building a Pokédex Exponent app with
Apollo. To learn how to do mutations, subscriptions, pagination, optimistic UI,
and more go to the Apollo React documentation at
`dev.apollodata.com/react <http://dev.apollodata.com/react/>`_. Everything you
learn there will work out of the box with Exponent and React Native.

There are some Apollo examples written in React Native that you may wish to
refer to. All the code should work equally well with Exponent.

1. The `“Hello World” example <https://github.com/apollostack/frontpage-react-native-app>`_ used at dev.apolldata.com.
2. A `GitHub API Example <https://github.com/apollostack/GitHub-GraphQL-API-Example>`_ built to work with GitHub’s new GraphQL API.
