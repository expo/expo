.. _using-graphcool:

Using Graphcool
=================

Graphcool combines GraphQL and AWS Lambda to provide a powerful backend
platform with an easy to use API. Features like realtime subscriptions,
permission rules and flexible data filters help you to quickly iterate on your
mobile application.

Because Graphcool is based on GraphQL, data can be consumed with any GraphQL
client or even using plain HTTP. No SDK is required.

Read `https://graph.cool/docs <https://graph.cool/docs>`_ for more general
information. For an in-depth tutorial using Apollo Client and Graphcool, follow
the `Learn Apollo Exponent
guide <https://www.learnapollo.com/tutorial-react-native-exponent/rne-01/>`_.

1. Connecting to Graphcool
^^^^^^^^^^^^^^^^^^^^^^^^^^^

After `creating a Graphcool account <https://console.graph.cool/signup>`_ and
setting up a new project, we can connect to it using a GraphQL client such as
Apollo Client or Relay.

Copy the project endpoint provided in the Graphcool Console and setup the
client's network interface. For Apollo Client, you have to use the project
endpoint as the ``uri`` parameter when creating the client. See :ref:`Using Apollo <using-apollo>`
for more information.


2. Storing Data and Receiving Updates
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When you are done setting up your data model it's time to start querying your
data. A flexible GraphQL API is automatically generated for you and you can
explore its query capabilities in the Playground. In an application where we
allow users to create posts with images and comments, we could use the
``createPost`` mutation to store a new post object:

.. code-block:: javascript

  mutation {
    createPost(
      description: "A parrot",
      imageUrl: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890"
    ) {
      id
    }
  }

To query all existing posts and their comments, you can execute the ``allPosts`` query:

.. code-block:: javascript

  query {
    allPosts {
      imageUrl
      comments {
        text
      }
    }
  }

You can run this query and explore other available queries in `this interactive
playground <https://api.graph.cool/simple/v1/ciwce5xw82kh7017179gwzn7q?query=query%20%7B%0A%20%20allPosts%20%7B%0A%20%20%20%20imageUrl%0A%20%20%20%20comments%20%7B%0A%20%20%20%20%20%20text%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D>`_
Mutations are disabled in this playground, but when you setup your own project
with a ``Post`` model, you can also run the ``createPost`` mutation seen above.

3. User Authentication with Auth0
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Graphcool comes with different authentication integrations out of the box. The
Auth0 integration works nicely together with the OAuth workflow available in
exponent.

Authenticating as a User
''''''''''''''''''''''''

Users can authenticate a GraphQL request by supplying a valid JWT in the
``Authorization`` header. If a valid token is passed as the ``Authorization``
header, you can query information on the logged-in user using the ``user`` query:

.. code-block:: javascript

  query {
    user {
      id
    }
  }

This returns the ``id`` of the authenticated user. If no valid token is
supplied, the data will return ``null``.

User Sign Up
''''''''''''

Signing up users is handled using the ``createUser`` mutation. With the Auth0
integration for Graphcool, creating a new user with a username, you could run
this mutation:

.. code-block:: javascript

  mutation ($idToken: String!, $name: String!) {
    createUser(authProvider: {auth0: {idToken: $idToken}, name: $name) {
      id
    }
  }

Social OAuth Authentication providers
'''''''''''''''''''''''''''''''''''''

Learn how to integrate with Auth0 social providers in the `exponent-auth0-example repository <https://github.com/graphcool-examples/exponent-auth0-example>`_.

4. Permissions
^^^^^^^^^^^^^^

The permission system at Graphcool complements the employed user authentication
nicely. You can control read and write access on a model or field level.

For example, if you want to express that only authenticated users can create
posts you can enable the ``create data`` operation for the ``Post`` model with
``AUTHENTICATED`` permission level.

Using so called permission queries, you can even go one step further and
describe arbitrary relations between the authenticated user and the manipulated
node. For example, you can only allow authenticated users to delete their own
posts but not the posts of other users.
