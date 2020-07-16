import Router from 'next/router';
import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';
import { LATEST_VERSION } from '~/common/versions';

const STYLES_INPUT = css`
  display: flex;
  position: relative;
  align-items: flex-end;

  .searchbox {
    width: auto;
  }

  .searchbox__submit {
    pointer-events: none;
  }

  .searchbox__input,
  input {
    font-family: ${Constants.fontFamilies.book};
    color: ${Constants.colors.black80};
    box-sizing: border-box;
    width: 38vw;
    font-size: 16px;
    line-height: 16px;
    padding: 2px 36px 0 36px;
    border-radius: 2px;
    height: 40px;
    outline: 0;
    border: 1px solid ${Constants.colors.border};
    background-color: ${Constants.expoColors.gray[200]};
  }

  input::placeholder,
  input::value {
    transform: translateY(0.5px);
  }

  .svg-icons {
    left: 240px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    display: none;
  }

  .shortcut-hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .search {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    display: flex;
    left: 8px;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
  }
`;

const STYLES_INPUT_MOBILE = css`
  flex: auto;
  margin: 0px 16px;

  .searchbox__input,
  input {
    width: calc(100vw - 32px) !important;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobileStrict}) {
    display: flex;
  }

  .close-search {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    color: rgba(0, 0, 0, 0.3);
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// TODO(jim): Not particularly happy with how this component chunks in while loading.
class AlgoliaSearch extends React.Component {
  state = {
    isFocused: false,
  };

  processUrl(url) {
    // Update URLs for new doc URLs
    var routes = url.split('/');
    routes[routes.length - 1] = routes[routes.length - 1].replace('.html', '');
    return routes.join('/');
  }

  componentDidMount() {
    const docsearch = require('docsearch.js');
    const Hotshot = require('hotshot');

    // latest is indexed in algolia, but we try to match the exact version instead
    // latest is also filtered using the facetFilters, and should not be returned in the search results
    const currentVersion = this.props.version === 'latest' ? LATEST_VERSION : this.props.version;

    this.docsearch = docsearch({
      apiKey: '2955d7b41a0accbe5b6aa2db32f3b8ac',
      indexName: 'expo',
      inputSelector: this.props.hiddenOnMobile
        ? '#algolia-search-box'
        : '#algolia-search-box-mobile',
      enhancedSearchInput: false,
      algoliaOptions: {
        // include pages without version (guides/get-started) OR exact version (api-reference)
        facetFilters: [['version:none', `version:${currentVersion}`]],
      },
      handleSelected: (input, event, suggestion) => {
        input.setVal('');

        const url = new URL(suggestion.url);
        const route = this.processUrl(url.pathname + url.hash);

        let asPath;
        if (Utilities.isVersionedUrl(suggestion.url) && this.props.version === 'latest') {
          asPath = this.processUrl(Utilities.replaceVersionInUrl(route, 'latest'));
        }

        if (asPath) {
          Router.push(route, asPath);
        } else {
          Router.push(route);
        }

        const docSearchEl = document.getElementById('docsearch');
        if (docSearchEl) {
          docSearchEl.blur();
        }

        const searchbox = document.querySelector('input#docsearch');
        const reset = document.querySelector('.searchbox [type="reset"]');

        if (reset) {
          reset.className = 'searchbox__reset';
          if (searchbox && searchbox.value.length === 0) {
            reset.className += ' hide';
          }
        }

        this.props.closeSidebar && this.props.closeSidebar();
      },
    });

    // add keyboard shortcut
    this.hotshot = new Hotshot({
      combos: [
        {
          keyCodes: [191], // open search by pressing / key
          callback: () =>
            setTimeout(() => document.getElementById('algolia-search-box').focus(), 16),
        },
      ],
    });
  }

  render() {
    return (
      <div
        className={`${STYLES_INPUT} ${!this.props.hiddenOnMobile && STYLES_INPUT_MOBILE}`}
        style={this.props.style}>
        <div className="search">
          <img src={'/static/images/header/search.svg'} />
        </div>

        <input
          onFocus={() => this.setState({ isFocused: true })}
          onBlur={() => this.setState({ isFocused: false })}
          id={this.props.hiddenOnMobile ? 'algolia-search-box' : 'algolia-search-box-mobile'}
          type="text"
          placeholder="Search the documentation"
          autoComplete="off"
          spellCheck="false"
          dir="auto"
          onClick={this.props.onStartMobileSearchText}
        />

        {this.props.hiddenOnMobile ? (
          <div
            className="shortcut-hint"
            style={{ display: this.state.isFocused ? 'none' : 'flex' }}>
            <img src={'/static/images/header/slash.svg'} />
          </div>
        ) : (
          <span className="close-search" onClick={this.props.onHideSearch}>
            <img src={'/static/images/header/x.svg'} />
          </span>
        )}
      </div>
    );
  }
}

export default AlgoliaSearch;
