import React from 'react';
import FilePlayer from 'react-player/lib/players/FilePlayer';
import VisibilitySensor from 'react-visibility-sensor';

export default class Video extends React.Component {
  state = {
    forceShowControls: false,
  };

  _handleClick = () => {
    if (typeof this.props.controls === 'undefined' && !this.state.forceShowControlsj) {
      this.setState({ forceShowControls: true });
    }
  };

  _handleMouseEnter = () => {
    this.setState({ hover: true });
  };

  _handleMouseLeave = () => {
    this.setState({ hover: false });
  };

  render() {
    let { spaceAfter } = this.props;
    let marginBottom = 0;

    if (typeof spaceAfter === 'undefined') {
      marginBottom = 30;
    } else if (typeof spaceAfter === 'number') {
      marginBottom = spaceAfter;
    } else if (spaceAfter) {
      marginBottom = 50;
    }

    return (
      <div
        onClick={this._handleClick}
        style={this.state.hover ? { cursor: 'pointer' } : null}
        onMouseEnter={this._handleMouseEnter}
        onMouseLeave={this._handleMouseLeave}>
        <VisibilitySensor>
          {({ isVisible }) => (
            <FilePlayer
              url={this.props.url || `/static/videos/${this.props.file}`}
              className="react-player"
              width="100%"
              height="400px"
              style={{
                outline: 'none',
                backgroundColor: '#000',
                borderRadius: 5,
                marginBottom,
                opacity: isVisible ? 1 : 0.7,
                transition: "opacity 0.5s ease-out",
              }}
              muted
              playing={isVisible}
              controls={
                typeof this.props.controls === 'undefined'
                  ? this.state.forceShowControls
                  : this.props.controls
              }
              playsinline
              loop
            />
          )}
        </VisibilitySensor>
      </div>
    );
  }
}
