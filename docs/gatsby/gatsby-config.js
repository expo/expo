const path = require(`path`);

module.exports = {
  siteMetadata: {
    title: `Expo`,
  },
  plugins: [
    `gatsby-plugin-glamor`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-53647600-7`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `docs`,
        path: path.join(__dirname, `..`, `/versions`),
      },
    },
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-typegen-remark-expo-embed`,
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
              wrapperStyle: `margin-bottom: 1.45rem;`,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.45rem;`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
          {
            resolve: `gatsby-typegen-remark-expo-autolink`,
            options: {
              offsetY: 69.6,
            },
          },
        ],
      },
    },
    // {
    //   resolve: `gatsby-plugin-offline`,
    //   options: {
    //     staticFileGlobs: [
    //       `public/**/*.woff2`,
    //       `public/commons*.js`,
    //       `public/app*.js`,
    //       `public/page-component*.js`,
    //       // This needs to be updated for every new version.
    //       // It sets up pre-caching in the service worker for data
    //       // bundles for doc pages.
    //       `public/path---versions-v-15*.js`,
    //       `public/index.html`,
    //       `public/manifest.json`,
    //       `public/offline-plugin-app-shell-fallback/index.html`,
    //     ],
    //   },
    // },
  ],
};
