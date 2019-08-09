import React from 'react';

export default class Error extends React.Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode };
  }

  componentDidMount() {
    let location;

    if (typeof window !== 'undefined') {
      location = window.location.href;
    }

    // Maybe redirect!?
    console.log(location);
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column'
        }}
      >
        <p style={{ textAlign: 'center' }}>
          Uh oh, we couldn't find this page! Maybe it doesn't exist anymore! 😔
        </p>
        <p style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="/">Go back to the Expo documentation</a>
        </p>
      </div>
    );
  }
}
