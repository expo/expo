import React from 'react';
import { Alert } from 'react-native';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import LikeButton from '../components/LikeButton';
import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';
import Connectivity from '../../Api/Connectivity';

const LikeProjectMutation = gql`
  mutation PerformLike($appId: ID!) {
    likeApp(appId: $appId) {
      id
      name
      likeCount
      isLikedByMe
    }
  }
`;

const UnlikeProjectMutation = gql`
  mutation UndoLike($appId: ID!) {
    unlikeApp(appId: $appId) {
      id
      name
      likeCount
      isLikedByMe
    }
  }
`;

@onlyIfAuthenticated
@graphql(UnlikeProjectMutation, {name: 'unlikeMutation'})
@graphql(LikeProjectMutation, {name: 'likeMutation'})
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

  _alertNoInternetConnection = (message = '') => {
    Alert.alert(
      "No internet connection available",
      message || "Please try again when you're back online"
    );
  }

  _handlePressAsync = async () => {
    if (!(await Connectivity.isAvailableAsync())) {
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

      console.log({result, appId: this.props.appId});
    } catch(e) {
      if (liked) {
        this._alertNoInternetConnection("Unable to like the project, try again later.");
      } else {
        this._alertNoInternetConnection("Unable to unlike the project, try again later.");
      }

      console.log({e});
    }
  }

  likeAsync = async () => {
    return this.props.likeMutation({variables: {appId: this.props.appId}});
  }

  unlikeAsync  = async () => {
    return this.props.unlikeMutation({variables: {appId: this.props.appId}});
  }
}
