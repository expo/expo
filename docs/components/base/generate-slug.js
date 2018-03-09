const slugs = require(`github-slugger`)();
slugs.reset();

const generateSlug = node => {
  return slugs.slug(toString(node));
};

const toString = node => {
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

export default generateSlug;
