import React from 'react';
import Link from 'gatsby-link';
import { rhythm, scale } from 'utils/typography';
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
          float: `right`
        }}>
        <input
          css={{
            ...scale((-1) / 5),
            border: `1px solid #ccc`,
            borderRadius: rhythm(1 / 4),
            padding: `${rhythm(1 / 8)} ${rhythm(1 / 2)}`
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
          background: `white`,
          borderBottom: `1px solid #ccc`,
          position: `fixed`,
          width: `100%`
        }}>
        <div
          css={{
            display: `none`,
            maxWidth: 1280,
            '@media (min-width: 750px)': {
              //[presets.Tablet]: { https://github.com/threepointone/glamor/pull/160
              display: `block`,
              padding: `${rhythm(1 / 2)} ${rhythm(2)}`,
              paddingBottom: `calc(${rhythm(1 / 2)} - 1px)`,
              left: 0,
              right: 0,
              top: 0,
              margin: `0 auto`
            }
          }}>
          <Link to={`/${this.props.activeVersion}/`}>
            <img
              src={logoText}
              css={{
                marginBottom: rhythm(0),
                height: rhythm(1.5),
                verticalAlign: 'middle'
              }}
            />
          </Link>
          <select
            value={this.props.activeVersion}
            onChange={e => this.props.setVersion(e.target.value)}
            css={{
              marginLeft: rhythm(1),
              border: `none`,
              background: `none`,
              borderRadius: 0,
              cursor: `pointer`,
              outline: `none`,
              fontSize: `100%`,
              textAlignLast: `center`,
              textAlign: `center`
            }}>
            {this.props.versions.map(version => {
              return (
                <option key={version} value={version}>
                  {version}
                </option>
              );
            })}
          </select>
          <AlgoliaSearch activeVersion={this.props.activeVersion} />
        </div>
      </div>
    );
  }
}

export default Header;
