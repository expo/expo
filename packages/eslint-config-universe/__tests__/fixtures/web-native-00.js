import React from 'react';

export default class Example extends React.Component {
  state = {
    x: 'x',
    ...{
      y: 'y',
    },
  };

  props;

  static getInitialProps() {}

  constructor(props, context) {
    super(props, context);
    this.state = {
      ...this.state,
      x: props.x,
    };
  }

  componentDidMount() {
    fetch('http://example.com');
    new XMLHttpRequest().send();
    Uint16Array.from([1, 2, 3, 4, 5]);
    new SharedArrayBuffer(16).slice();
  }

  shouldComponentUpdate() {}

  render() {
    return <div>{this.state.x}</div>;
  }

  _handleWhatever() {}
}
