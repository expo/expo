import React from 'react';
import presets from 'glamor-media-query-presets';

import { rhythm, scale } from '../utils/typography';

class AlgoliaSearch extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (
      this.props.activeVersion &&
      this.props.activeVersion !== nextProps.activeVersion
    ) {
      this.docsearch.algoliaOptions = {
        ...this.docsearch.algoliaOptions,
        facetFilters: [`tags:${nextProps.activeVersion}`],
      };
    }
  }

  componentDidMount() {
    const docsearch = require('docsearch.js');
    const Hotshot = require('hotshot');
    this.docsearch = docsearch({
      appId: 'S6DBW4862L',
      apiKey: '59ebba04e5d2e4bed5d5ae12eed28bdd',
      indexName: 'exponent-docs-v2',
      inputSelector: '#algolia-search-box',
      algoliaOptions: {
        facetFilters: [`tags:${this.props.activeVersion}`],
        hitsPerPage: 10,
      },
      enhancedSearchInput: true,
      handleSelected: (input, event, suggestion) => {
        input.setVal('');
        const url = suggestion.url;
        const route = url.match(/https?:\/\/(.*)(\/versions\/.*)/)[2];
        this.props.router.push(route);
        document.getElementById('docsearch').blur();
        const searchbox = document.querySelector('input#docsearch');
        const reset = document.querySelector('.searchbox [type="reset"]');
        reset.className = 'searchbox__reset';
        if (searchbox.value.length === 0) {
          reset.className += ' hide';
        }
        this.props.closeSidebar && this.props.closeSidebar();
      },
    });

    // add keyboard shortcut
    this.hotshot = new Hotshot({
      combos: [
        {
          keyCodes: [16, 191], // shift + / (otherwise known as '?')
          callback: () =>
            setTimeout(() => document.getElementById('docsearch').focus(), 16),
        },
      ],
    });
  }

  componentWillUnmount() {}

  render() {
    return (
      <div
        css={{
          float: this.props.float || `none`,
          marginTop: `12px`,
          [presets.Tablet]: {
            marginTop: `0px`,
          },
        }}>
        <input
          css={{
            ...scale(-1 / 5),
            border: `1px solid #eee`,
            borderRadius: 3,
            fontSize: '14px',
            padding: '2px 10px',
            marginTop: '2px',
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

export default AlgoliaSearch;
