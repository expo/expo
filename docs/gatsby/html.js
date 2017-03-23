import React from "react";
import { TypographyStyle } from "react-typography";
import Helmet from "react-helmet";

import typography from "./utils/typography";
import favicon from "images/favicon-32x32.png";

let stylesStr;
const env = process.env.NODE_ENV;

if (env === `production`) {
  try {
    stylesStr = require(`!raw-loader!./public/styles.css`);
  } catch (e) {
    console.log(e);
  }
}

module.exports = React.createClass({
  render() {
    const head = Helmet.rewind();
    let css;
    if (env === `production`) {
      css = (
        <style
          id="gatsby-inlined-css"
          dangerouslySetInnerHTML={{ __html: stylesStr }}
        />
      );
    }

    let gatsbyEnv = (
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{ __html: `window.GATSBY_ENV = "${env}";` }}
      />
    );

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/docsearch.js/2/docsearch.min.css"
          />
          <link rel="icon" type="image/png" href={favicon} sizes="32x32" />

          {this.props.headComponents}
          <TypographyStyle typography={typography} />
          {css}
          {gatsbyEnv}
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
        </head>
        <body>
          <div
            id="react-mount"
            dangerouslySetInnerHTML={{ __html: this.props.body }}
          />
          {this.props.postBodyComponents}
        </body>
      </html>
    );
  },
});
