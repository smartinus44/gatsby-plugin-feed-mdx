export const runQuery = (handler, query) =>
  handler(query).then((r) => {
    if (r.errors) {
      throw new Error(r.errors.join(`, `));
    }

    return r.data;
  });

export const defaultOptions = {
  // Run a default query to gather some information about the site.
  query: `
  {
    site {
      siteMetadata {
        title
        description
        siteUrl
        site_url: siteUrl
      }
    }
  }
`,

  // Setup an RSS object, merging on various feed-specific options.
  setup: ({
    query: {
      site: { siteMetadata },
    },
    ...rest
  }) => {
    return {
      ...siteMetadata,
      ...rest,
    };
  },

  // Create a default RSS feed. Others may be added by using the format below.
  feeds: [
    {
      query: `
    {
      allMdx(
        limit: 1000,
        sort: {
          order: DESC,
          fields: [frontmatter___date]
        }
      ) {
        edges {
          node {
            frontmatter {
              title
              date
            }
            fields {
              slug
            }
            excerpt
            html
          }
        }
      }
    }
  `,

      // Where we will save the feed generated by this query.
      output: `rss.xml`,
    },
  ],
};
