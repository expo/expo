import React from 'react';
import FilePlayer from 'react-player/lib/players/FilePlayer';
import VisibilitySensor from 'react-visibility-sensor';

export default class Video extends React.Component {
  render() {
    return (
      <VisibilitySensor>
        {({ isVisible }) => (
          <FilePlayer
            url={this.props.url || `/static/videos/${this.props.file}`}
            width="100%"
            muted
            playing={isVisible}
            controls
            loop
          />
        )}
      </VisibilitySensor>
    );
  }
}
