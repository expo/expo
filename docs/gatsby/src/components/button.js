import React from 'react';

// NOTE (Abi): These styles are copied from www

class Button extends React.Component {
  render() {
    return (
      <span
        onClick={this.props.onClick}
        css={{
          backgroundColor: 'rgb(5, 110, 207)',
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
