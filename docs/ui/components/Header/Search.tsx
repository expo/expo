import { css } from '@emotion/react';
import { theme, breakpoints, iconSize, SearchIcon } from '@expo/styleguide';
import Router from 'next/router';
import * as React from 'react';

import * as Utilities from '~/common/utilities';
import { paragraph } from '~/components/base/typography';
import { LATEST_VERSION } from '~/constants/versions';
import { SlashShortcutIcon } from '~/ui/foundations/icons';

type Props = {
  version: string;
  mobile?: boolean;
};

// TODO(simek): ensure that processUrl is still needed
const processUrl = (url: string) => {
  // Update URLs for new doc URLs
  const routes = url.split('/');
  routes[routes.length - 1] = routes[routes.length - 1].replace('.html', '');
  return routes.join('/');
};

export class Search extends React.Component<Props> {
  private searchRef = React.createRef<HTMLInputElement>();
  private docsearch: any;
  private hotshot: any;

  state = {
    isFocused: false,
    isDropdownVisible: false,
  };

  private focusSearchInput() {
    const { current } = this.searchRef;
    if (current) {
      current.focus();
    }
  }

  private onChange() {
    const { current } = this.searchRef;
    if (current) {
      this.setState({
        isDropdownVisible: current.value.length && current.getAttribute('aria-expanded'),
      });
    }
  }

  private onResultSelected(input: any, suggestion: any, isLatestVersion: boolean) {
    input.setVal('');

    const url = new URL(suggestion.url);
    const route = processUrl(url.pathname + url.hash);

    if (Utilities.isVersionedUrl(suggestion.url) && isLatestVersion) {
      const asPath = processUrl(Utilities.replaceVersionInUrl(route, 'latest'));
      Router.push(route, asPath);
    } else {
      Router.push(route);
    }

    const docSearchEl = document.getElementById('docsearch');
    if (docSearchEl) {
      docSearchEl.blur();
    }
  }

  componentDidMount() {
    const docsearch = require('docsearch.js');
    const Hotshot = require('hotshot');

    const { version, mobile } = this.props;
    const isLatestVersion = version === 'latest';

    // latest is indexed in algolia, but we try to match the exact version instead
    // latest is also filtered using the facetFilters, and should not be returned in the search results
    const currentVersion = isLatestVersion ? LATEST_VERSION : version;

    this.docsearch = docsearch({
      apiKey: '2955d7b41a0accbe5b6aa2db32f3b8ac',
      indexName: 'expo',
      inputSelector: mobile ? '#algolia-search-box' : '#algolia-search-box-mobile',
      enhancedSearchInput: false,
      algoliaOptions: {
        // include pages without version (guides/get-started) OR exact version (api-reference)
        facetFilters: [['version:none', `version:${currentVersion}`]],
      },
      handleSelected: (input: any, _: any, suggestion: any) =>
        this.onResultSelected(input, suggestion, isLatestVersion),
    });

    if (!mobile) {
      // add keyboard shortcut for desktop
      this.hotshot = new Hotshot({
        combos: [
          {
            keyCodes: [191], // open search by pressing `/` key
            callback: () => setTimeout(() => this.focusSearchInput(), 0),
          },
        ],
      });
    } else {
      // auto-focuses on mobile
      this.focusSearchInput();
    }
  }

  render() {
    const { isFocused, isDropdownVisible } = this.state;
    const { mobile } = this.props;
    return (
      <div css={[searchContainerStyle, mobile && mobileSearchContainerStyle]}>
        <div className="search">
          <SearchIcon size={iconSize.small} />
        </div>
        <input
          onFocus={() => this.setState({ isFocused: true })}
          onBlur={() => this.setState({ isFocused: false })}
          onChange={() => this.onChange()}
          id={mobile ? 'algolia-search-box' : 'algolia-search-box-mobile'}
          className={isDropdownVisible ? 'algolia-search-box-autocomplete-on' : undefined}
          type="text"
          placeholder="Search"
          autoComplete="off"
          spellCheck="false"
          dir="auto"
          ref={this.searchRef}
        />
        {!mobile && !isFocused ? (
          <div className="shortcut-hint">
            <SlashShortcutIcon />
          </div>
        ) : null}
      </div>
    );
  }
}

const searchContainerStyle = css`
  display: flex;
  position: relative;
  align-items: flex-end;
  width: 100%;
  // Current doc container max-width - padding, to match page max width
  max-width: calc(${breakpoints.large} - (56px * 2));

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }

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
    width: 100%;
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

  .search,
  .shortcut-hint {
    color: ${theme.icon.default};
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 102;
  }

  .shortcut-hint {
    right: 12px;
  }

  .search {
    left: 12px;
  }
`;

const mobileSearchContainerStyle = css`
  display: none;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: flex;
  }
`;
