import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import Router from 'next/router';
import * as React from 'react';

import * as Utilities from '~/common/utilities';
import { paragraph } from '~/components/base/typography';
import { Search as SearchIcon } from '~/components/icons/Search';
import { SlashShortcut } from '~/components/icons/SlashShortcut';
import { X } from '~/components/icons/X';
import * as Constants from '~/constants/theme';
import { LATEST_VERSION } from '~/constants/versions';

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
    ${paragraph}
    -webkit-appearance: none;
    box-sizing: border-box;
    width: 24vw;
    max-width: ${Constants.breakpoints.mobileValue - 32}px;
    padding: 0 16px 0 40px;
    border-radius: 4px;
    height: 40px;
    outline: 0;
    border: none;
    background-color: ${theme.background.secondary};
  }

  .svg-icons {
    left: 240px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }

  .shortcut-hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    right: 12px;
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
    left: 12px;
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

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
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
    cursor: pointer;
  }
`;

type Props = {
  version: string;
  hiddenOnMobile?: boolean;
  style?: React.CSSProperties;
  closeSidebar?: () => void;
  onToggleSearch?: () => void;
};

// TODO(jim): Not particularly happy with how this component chunks in while loading.
export class Search extends React.Component<Props> {
  private searchRef = React.createRef<HTMLInputElement>();
  private docsearch: any;
  private hotshot: any;

  state = {
    isFocused: false,
  };

  private processUrl(url: string) {
    // Update URLs for new doc URLs
    const routes = url.split('/');
    routes[routes.length - 1] = routes[routes.length - 1].replace('.html', '');
    return routes.join('/');
  }

  private focusSearchInput() {
    if (this.searchRef.current) {
      this.searchRef.current.focus();
    }
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
      // TODO: Get the type definitions for Algolia DocSearch
      handleSelected: (input: any, event: any, suggestion: any) => {
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

        const searchbox = document.querySelector('input#docsearch') as HTMLInputElement;
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

    // add keyboard shortcut for desktop
    if (this.props.hiddenOnMobile) {
      this.hotshot = new Hotshot({
        combos: [
          {
            keyCodes: [191], // open search by pressing / key
            callback: () => setTimeout(() => this.focusSearchInput(), 0),
          },
        ],
      });
    }

    if (!this.props.hiddenOnMobile) {
      //auto-focuses on mobile
      this.focusSearchInput();
    }
  }

  render() {
    return (
      <div
        css={[STYLES_INPUT, !this.props.hiddenOnMobile && STYLES_INPUT_MOBILE]}
        style={this.props.style}>
        <div className="search">
          <SearchIcon />
        </div>

        <input
          onFocus={() => this.setState({ isFocused: true })}
          onBlur={() => this.setState({ isFocused: false })}
          id={this.props.hiddenOnMobile ? 'algolia-search-box' : 'algolia-search-box-mobile'}
          type="text"
          placeholder="Search"
          autoComplete="off"
          spellCheck="false"
          dir="auto"
          ref={this.searchRef}
        />

        {this.props.hiddenOnMobile ? (
          <div
            className="shortcut-hint"
            style={{ display: this.state.isFocused ? 'none' : 'flex' }}>
            <SlashShortcut />
          </div>
        ) : (
          <span className="close-search" onClick={this.props.onToggleSearch}>
            <X />
          </span>
        )}
      </div>
    );
  }
}
