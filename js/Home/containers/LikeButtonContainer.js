import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import LikeButton from '../components/LikeButton';
import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';

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

  _handlePressAsync = async () => {
    try {
      let result;

      if (this.props.liked) {
        result = await this.unlikeAsync();
      } else {
        result = await this.likeAsync();
      }

      console.log({result, appId: this.props.appId});
    } catch(e) {
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
