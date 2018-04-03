// NOTE(jim):
// GETTING NESTED SCROLL RIGHT IS DELICATE BUSINESS. THEREFORE THIS COMPONENT
// IS THE ONLY PLACE WHERE SCROLL CODE SHOULD BE HANDLED. THANKS.
import styled, { keyframes, css, injectGlobal } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

// NOTE(jim): Global styles if and only if this component is used.
injectGlobal`
  html {
    height: 100%;
    overflow: hidden;
  }

  body {
    height: 100%;
  }

  body>div {
    height: 100%;
  }

  #__next {
    height: 100%;
  }

  [data-reactroot] {
    height: 100%;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    html {
      height: auto;
      overflow: auto;

      /* width */
      ::-webkit-scrollbar {
        width: 4px;
      }

      /* Track */
      ::-webkit-scrollbar-track {
        background: ${Constants.colors.white};
      }

      /* Handle */
      ::-webkit-scrollbar-thumb {
        background: ${Constants.colors.black60};
      }

      /* Handle on hover */
      ::-webkit-scrollbar-thumb:hover {
        background: ${Constants.colors.expo};
      }
    }

    body {
      height: auto;
    }

    body>div {
      height: auto;
    }

    #__next {
      height: auto;
    }

    [data-reactroot] {
      height: auto;

    }
  }
`;

const STYLES_CONTAINER = css`
  height: 100%;
`;

const STYLES_HEADER = css`
  border-bottom: 1px solid ${Constants.colors.border};
`;

const STYLES_CONTENT = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    height: auto;
  }
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  border-right: 1px solid ${Constants.colors.border};
  max-width: 280px;
  transition: 200ms ease max-width;

  @media screen and (max-width: 1200px) {
    max-width: 240px;
  }

  height: 100%;
  overflow: hidden;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

const STYLES_RIGHT = css`
  min-width: 5%;
  width: 100%;
  height: 100%;
  overflow: hidden;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    height: auto;
    overflow: auto;
  }
`;

// NOTE(jim):
// All the other components tame the UI. this one allows a container to scroll.
const STYLES_SCROLL_CONTAINER = css`
  height: 100%;
  width: 100%;
  padding-bottom: 72px;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;

  /* width */
  ::-webkit-scrollbar {
    width: 4px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: ${Constants.colors.white};
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${Constants.colors.black60};
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${Constants.colors.expo};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    overflow-y: auto;
  }
`;

const ScrollContainer = props => {
  return <div className={STYLES_SCROLL_CONTAINER}>{props.children}</div>;
};

export default props => {
  return (
    <div className={STYLES_CONTAINER}>
      <div className={STYLES_HEADER}>{props.header}</div>
      <div className={STYLES_CONTENT}>
        {!props.isMenuActive ? (
          <div className={STYLES_LEFT}>
            <ScrollContainer>{props.sidebar}</ScrollContainer>
          </div>
        ) : (
          undefined
        )}
        <div className={STYLES_RIGHT}>
          <ScrollContainer>{props.children}</ScrollContainer>
        </div>
      </div>
    </div>
  );
};
