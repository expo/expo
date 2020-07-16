import React from 'react';
import NextHead from 'next/head';

export default class Head extends React.PureComponent {
  render() {
    return (
      <div>
        <NextHead>
          <title>{this.props.title}</title>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />
          <link href="/static/libs/algolia/algolia-mobile.css" rel="stylesheet" />
          {this.props.children}
        </NextHead>
      </div>
    );
  }
}
