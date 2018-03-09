import React from 'react';
import * as Constants from '~/style/constants';

class Button extends React.Component {
  render() {
    return (
      <span
        onClick={this.props.onClick}
        style={{
          backgroundColor: Constants.colors.black,
          color: 'rgb(255, 255, 255)',
          height: '30px',
          paddingLeft: '12px',
          paddingRight: '12px',
          borderRadius: '4px',
          border: '1px solid transparent',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {this.props.value}
      </span>
    );
  }
}

export default Button;
