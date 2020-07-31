import * as React from 'react';
import stringReplace from 'react-string-replace';
import Colors from '../constants/Colors';
import { A } from '@expo/html-elements';

const MENTIONS_REGULAR_EXPRESSION = /@([A-Za-z0-9-_]+)/g;
const HREF_REGULAR_EXPRESSION = /(https?:\/\/\S+)/g;
const HASHTAG_REGULAR_EXPRESSION = /#(\w+)/g;

const linkStyle = {
  color: Colors.light.tintColor,
};

const matchHashtagToLinkComponents = (match, key) => {
  const url = `https://expo.io/tags/${match}`;
  return (
    <A style={linkStyle} key={match + key} href={url}>
      #{match}
    </A>
  );
};

const matchTwitterToLinkComponents = (match, key) => {
  const url = `https://twitter.com/@${match}`;
  return (
    <A style={linkStyle} key={match + key} href={url}>
      @{match}
    </A>
  );
};

const matchExpoToLinkComponents = (match, key) => {
  const url = `https://expo.io/@${match}`;
  return (
    <A style={linkStyle} key={match + key} href={url}>
      @{match}
    </A>
  );
};

const matchHrefToLinkComponents = (match, key) => {
  return (
    <A style={linkStyle} key={`${match}${key}`} href={match}>
      {match}
    </A>
  );
};

export const mutateStringWithLinkComponents = (
  text: string,
  options?: { twitter?: boolean }
): React.ReactNodeArray => {
  let outputText = stringReplace(text, HREF_REGULAR_EXPRESSION, matchHrefToLinkComponents);
  outputText = stringReplace(outputText, HASHTAG_REGULAR_EXPRESSION, matchHashtagToLinkComponents);

  if (options?.twitter) {
    outputText = stringReplace(
      outputText,
      MENTIONS_REGULAR_EXPRESSION,
      matchTwitterToLinkComponents
    );
  } else {
    outputText = stringReplace(outputText, MENTIONS_REGULAR_EXPRESSION, matchExpoToLinkComponents);
  }

  return outputText;
};
