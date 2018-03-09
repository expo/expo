import React from 'react';
import NextHead from 'next/head';

class Head extends React.PureComponent {
  render() {
    return (
      <div>
        <NextHead>
          <title>{this.props.title}</title>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />

          <link href="/static/libs/prism/prism.css" rel="stylesheet" />
          <link href="/static/libs/prism/prism-coy.css" rel="stylesheet" />
          <script src="/static/libs/prism/prism.js" />

          <script src="/static/libs/tippy/tippy.all.min.js" />

          <link href="/static/libs/algolia/algolia.min.css" rel="stylesheet" />
          <link href="/static/libs/algolia/algolia-mobile.css" rel="stylesheet" />

          <link href="/static/libs/nprogress/nprogress.css" rel="stylesheet" />
          <script src="/static/libs/nprogress/nprogress.js" />

          {this.props.children}
        </NextHead>
      </div>
    );
  }
}

export default Head;
