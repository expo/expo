import React from 'react';

export default class Example extends React.Component {
  props = { x: 'x' };

  componentDidMount() {
    alert('uh oh');
    this.setState({});
  }

  render() {
    return <div>{this.props.x}</div>;
  }
}
