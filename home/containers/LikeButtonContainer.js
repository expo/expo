/* @flow */

import React from 'react';
import { Alert } from 'react-native';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import LikeButton from '../components/LikeButton';
import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';
import Connectivity from '../api/Connectivity';
import Analytics from '../api/Analytics';

const LikeProjectMutation = gql`
  mutation Home_PerformLike($appId: ID!) {
    app(appId: $appId) {
      like {
        id
        name
        likeCount
        isLikedByMe
      }
    }
  }
`;

const UnlikeProjectMutation = gql`
  mutation Home_UndoLike($appId: ID!) {
    app(appId: $appId) {
      unlike {
        id
        name
        likeCount
        isLikedByMe
      }
    }
  }
`;

@onlyIfAuthenticated
@graphql(UnlikeProjectMutation, { name: 'unlikeMutation' })
@graphql(LikeProjectMutation, { name: 'likeMutation' })
export default class LikeButtonContainer extends React.Component {
  render() {
    return (
      <LikeButton
        style={this.props.style}
        liked={this.props.liked}
        onPress={this._handlePressAsync}
      />
    );
  }

  _alertNoInternetConnection = (message: string = '') => {
    Alert.alert(
      'No internet connection available',
      message || "Please try again when you're back online"
    );
  };

  _handlePressAsync = async () => {
    if (!await Connectivity.isAvailableAsync()) {
      this._alertNoInternetConnection();
      return;
    }

    let { liked } = this.props;
    let result;

    try {
      if (liked) {
        result = await this.unlikeAsync();
      } else {
        result = await this.likeAsync();
      }

      Analytics.track(Analytics.events.USER_UPDATED_LIKE, {
        appId: this.props.appId,
        like: !liked,
      });
    } catch (e) {
      if (e.graphQLErrors) {
        // TODO: handle error. this can happen if you like a project
        // from another session, then try to like it here. we should
        // refetch the data instead, but not sure the best way to do
        // this with apollo currently.
        alert('Oops, something went wrong! Sorry about that.');
      } else {
        if (liked) {
          this._alertNoInternetConnection('Unable to like the project, try again later.');
        } else {
          this._alertNoInternetConnection('Unable to unlike the project, try again later.');
        }
      }
      console.log({ e });
    }
  };

  likeAsync = async () => {
    return this.props.likeMutation({
      variables: { appId: this.props.appId },
      optimisticResponse: {
        __typename: 'Mutation',
        app: {
          __typename: 'AppMutation',
          like: {
            __typename: 'App',
            id: this.props.appId,
            isLikedByMe: true,
            likeCount: this.props.likeCount + 1,
          },
        },
      },
    });
  };

  unlikeAsync = async () => {
    return this.props.unlikeMutation({
      variables: { appId: this.props.appId },
      optimisticResponse: {
        __typename: 'Mutation',
        app: {
          __typename: 'AppMutation',
          unlike: {
            __typename: 'App',
            id: this.props.appId,
            isLikedByMe: false,
            likeCount: this.props.likeCount - 1,
            name: this.props.name,
          },
        },
      },
    });
  };
}
