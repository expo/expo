module.exports = {
  siteMetadata: {
    title: 'Exponent'
  },
  plugins: [
    `gatsby-plugin-glamor`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-53647600-7`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `docs`,
        path: `${__dirname}/../versions`
      }
    },
    `gatsby-parser-remark`,
    `gatsby-parser-sharp`,
    {
      resolve: `gatsby-typegen-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-typegen-remark-responsive-image`,
            options: {
              maxWidth: 800,
              wrapperStyle: `margin-bottom: 1.45rem;`
            }
          },
          {
            resolve: `gatsby-typegen-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.45rem;`
            }
          },
          `gatsby-typegen-remark-copy-linked-files`,
          `gatsby-typegen-remark-prismjs`,
          `gatsby-typegen-remark-smartypants`,
          {
            resolve: `gatsby-typegen-remark-expo-autolink`,
            options: {
              offsetY: 69.6
            }
          }
        ]
      }
    },
    `gatsby-typegen-filesystem`,
    `gatsby-typegen-sharp`
  ]
};
