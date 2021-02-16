jest.mock(`fs-extra`);
const fs = require(`fs-extra`);
const path = require(`path`);
const { onPostBuild } = require(`../gatsby-node`);
const DATE_TO_USE = new Date(`2018`);
const _Date = Date;
global.Date = jest.fn(() => DATE_TO_USE);
global.Date.UTC = _Date.UTC;
global.Date.now = _Date.now;

describe(`Test plugin feed`, () => {
  beforeEach(() => {
    fs.exists = jest.fn().mockResolvedValue(true);
    fs.writeFile = jest.fn().mockResolvedValue();
    fs.mkdirp = jest.fn().mockResolvedValue();
  });

  it(`custom properties work properly`, async () => {
    fs.writeFile = jest.fn();
    fs.writeFile.mockResolvedValue(true);
    const graphql = jest.fn();
    graphql.mockResolvedValue({
      data: {
        site: {
          siteMetadata: {
            title: `site title`,
            description: `a description`,
            siteUrl: `http://dummy.url/`,
          },
        },
        allMdx: {
          edges: [
            {
              node: {
                frontmatter: {
                  path: `a-custom-path`,
                },
                excerpt: `post description`,
              },
            },
            {
              node: {
                frontmatter: {
                  path: `another-custom-path`,
                },
                excerpt: `post description`,
              },
            },
          ],
        },
      },
    });
    const customQuery = `
    {
      allMdx(
        limit: 1000,
      ) {
        edges {
          node {
            frontmatter {
              path
            }
            excerpt
          }
        }
      }
    }
  `;
    const options = {
      feeds: [
        {
          output: `rss.xml`,
          title: `feed title`,
          language: `en`,
          generator: `custom generator`,
          query: customQuery,
          serialize: ({ query: { site, allMdx } }) =>
            allMdx.edges.map((edge) => {
              return {
                ...edge.node.frontmatter,
                description: edge.node.excerpt,
                url: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
              };
            }),
        },
      ],
    };
    await onPostBuild({ graphql }, options);
    const [filePath, contents] = fs.writeFile.mock.calls[0];
    expect(filePath).toEqual(path.join(`public`, `rss.xml`));
    expect(contents).toMatchSnapshot();
  });

  it(`custom query runs`, async () => {
    fs.writeFile = jest.fn();
    fs.writeFile.mockResolvedValue(true);
    const graphql = jest.fn();
    graphql.mockResolvedValue({
      data: {
        site: {
          siteMetadata: {
            title: `a sample title`,
            description: `a description`,
            siteUrl: `http://dummy.url/`,
          },
        },
        allMdx: {
          edges: [
            {
              node: {
                frontmatter: {
                  path: `a-custom-path`,
                },
                excerpt: `post description`,
              },
            },
            {
              node: {
                frontmatter: {
                  path: `another-custom-path`,
                },
                excerpt: `post description`,
              },
            },
          ],
        },
      },
    });
    const customQuery = `
    {
      allMdx(
        limit: 1000,
      ) {
        edges {
          node {
            frontmatter {
              path
            }
            excerpt
          }
        }
      }
    }
  `;
    const options = {
      feeds: [
        {
          output: `rss_new.xml`,
          serialize: ({ query: { site, allMdx } }) =>
            allMdx.edges.map((edge) => {
              return {
                ...edge.node.frontmatter,
                description: edge.node.excerpt,
                url: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
              };
            }),
          query: customQuery,
          title: `my feed`,
        },
      ],
    };
    await onPostBuild({ graphql }, options);
    const [filePath, contents] = fs.writeFile.mock.calls[0];
    expect(filePath).toEqual(path.join(`public`, `rss_new.xml`));
    expect(contents).toMatchSnapshot();
    expect(graphql).toBeCalledWith(customQuery);
  });

  it(`does not mutate base query when merging`, async () => {
    fs.writeFile = jest.fn();
    fs.writeFile.mockResolvedValue();

    const siteQuery = {
      data: {
        site: {
          siteMetadata: {
            title: `Hello World`,
          },
        },
      },
    };

    const mdxQuery = {
      data: {
        allMdx: {
          edges: [
            {
              node: {
                fields: {
                  slug: `/hello-world`,
                },
                frontmatter: {
                  title: `Hello World`,
                },
              },
            },
          ],
        },
      },
    };

    const graphql = jest
      .fn()
      .mockResolvedValueOnce(siteQuery)
      .mockResolvedValueOnce(mdxQuery);

    const options = {
      query: `{}`,
      feeds: [
        {
          output: `rss.xml`,
          query: `{ firstMdxQuery }`,
          serialize: ({ query: { allMdx } }) =>
            allMdx.edges.map((edge) => {
              return {
                ...edge.node.frontmatter,
              };
            }),
        },
      ],
    };

    await onPostBuild({ graphql }, options);

    expect(siteQuery).toEqual({
      data: {
        site: expect.any(Object),
      },
    });
  });
});
