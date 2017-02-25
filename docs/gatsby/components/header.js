import { orderBy } from 'lodash';
import React from 'react';
import Link from 'gatsby-link';
import { rhythm, scale } from 'utils/typography';
import { presets } from 'glamor';
import logoText from 'images/logo-text.png';

class AlgoliaSearch extends React.Component {
  componentDidMount() {
    setTimeout(
      () => {
        docsearch({
          appId: 'S6DBW4862L',
          apiKey: '59ebba04e5d2e4bed5d5ae12eed28bdd',
          indexName: 'exponent-docs-v2',
          inputSelector: '#algolia-search-box',
          algoliaOptions: {
            facetFilters: [`tags:${this.props.activeVersion}`],
            hitsPerPage: 5
          }
        });
      },
      1000
    );
  }

  render() {
    return (
      <div
        css={{
          float: `left`
        }}>
        <input
          css={{
            ...scale((-1) / 5),
            border: `1px solid #eee`,
            borderRadius: 3,
            fontSize: '14px',
            padding: '2px 10px',
            marginTop: '2px'
          }}
          id="algolia-search-box"
          type="text"
          placeholder="Search..."
          autoComplete="off"
          spellCheck="false"
          dir="auto"
        />
      </div>
    );
  }
}

class Header extends React.Component {
  render() {
    return (
      <div
        css={{
          zIndex: 1000,
          background: `#fff`,
          borderBottom: `1px solid #efefef`,
          position: `fixed`,
          width: `100%`,
          height: 45,
          [presets.Tablet]: {
            height: 58
          }
        }}>
        <div
          css={{
            display: `none`,
            maxWidth: 1280,
            '@media (min-width: 750px)': {
              //[presets.Tablet]: { https://github.com/threepointone/glamor/pull/160
              display: `block`,
              left: 0,
              right: 0,
              top: 0,
              padding: 15,
              paddingLeft: 20,
              height: 58,
              margin: `0 auto`
            }
          }}>
          <div
            css={{
              [presets.Tablet]: {
                marginTop: '4px',
                display: 'inline-block'
              }
            }}>
            <Link to={`/versions/${this.props.activeVersion}/index.html`}>
              <img
                src={logoText}
                css={{
                  marginBottom: rhythm(0),
                  height: rhythm(1.5),
                  verticalAlign: 'middle',
                  [presets.Tablet]: {
                    height: 25
                  }
                }}
              />
            </Link>
          </div>

          <div
            css={{
              float: `right`
            }}>
            <div
              css={{
                paddingTop: '4px',
                paddingRight: '10px',
                display: 'inline-block'
              }}>
              <select
                value={this.props.activeVersion}
                onChange={e => this.props.setVersion(e.target.value)}
                css={{
                  marginLeft: '4px',
                  background: `none`,
                  borderRadius: 0,
                  cursor: `pointer`,
                  outline: `none`,
                  fontSize: `100%`,
                  // backgroundColor: '#f7f7f7',
                  // borderColor: '#ccc',
                  border: 'none',
                  textAlignLast: `center`,
                  textAlign: `center`
                }}>
                {orderBy(this.props.versions, v => parseInt(v.match(/v([0-9]+)\./)[1], 10), ['asc'])
                  .map(version => {
                    return (
                      <option key={version} value={version}>
                        {version}
                      </option>
                    );
                  })
                  .reverse()}
              </select>
            </div>

            <AlgoliaSearch activeVersion={this.props.activeVersion} />
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
