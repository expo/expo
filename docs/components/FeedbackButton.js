import * as React from 'react';
import stripVersionFromPath from '~/common/stripVersionFromPath';

export default class FeedbackButton extends React.Component {
  state = {
    isFeedbackSent: false,
  };

  _handleFeedback = (description, value) => {
    window.ga('send', {
      hitType: 'event',
      eventCategory: 'feedback',
      eventAction: description,
      eventLabel: stripVersionFromPath(document.location.pathname),
      eventValue: value,
    });

    this.setState({ isFeedbackSent: true });
  };

  render() {
    if (this.state.isFeedbackSent) {
      return (
        <div>
          <h1>thanks</h1>
        </div>
      );
    } else {
      return (
        <div>
          <h1 onClick={() => this._handleFeedback('great', 2)}>great!</h1>
          <h1 onClick={() => this._handleFeedback('fine', 1)}>fine</h1>
          <h1 onClick={() => this._handleFeedback('terrible', 0)}>terrible</h1>
        </div>
      );
    }
  }
}
