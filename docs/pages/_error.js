import React from 'react';

export default class Error extends React.Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode };
  }

  render() {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ textAlign: 'center' }}>
          {this.props.statusCode
            ? `Uh oh, we received a ${this.props.statusCode} error. Maybe the URL doesn't exist anymore.`
            : 'An unexpected error has occurred.'}
        </p>
      </div>
    );
  }
}
