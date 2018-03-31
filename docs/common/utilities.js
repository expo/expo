import GithubSlugger from 'github-slugger';

const GithubSluggerInstance = GithubSlugger();

// TODO(jim): Not sure what is the point of this.
export const toString = node => {
  if (typeof node === 'string') {
    return node;
  } else if (Array.isArray(node)) {
    return node.map(toString).join('');
  } else if (node.props.children) {
    return toString(node.props.children);
  } else {
    return '';
  }
};

export const generateSlug = node => {
  GithubSluggerInstance.reset();
  return GithubSluggerInstance.slug(toString(node));
};

export const replaceVersionInUrl = (url, replaceWith) => {
  let urlArr = url.split('/');
  urlArr[2] = replaceWith;
  return urlArr.join('/');
};

export const getVersionFromUrl = url => {
  return url.split('/')[2];
};
