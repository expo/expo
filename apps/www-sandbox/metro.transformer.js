const upstreamTransformer = require('@expo/metro-config/babel-transformer');
const MdxTransformer = require('@bacons/mdx/metro-transformer');

const mdxTransformer = MdxTransformer.createTransformer({});

module.exports.transform = async (props) => {
  // Then pass it to the upstream transformer.
  return upstreamTransformer.transform(
    // Transpile MDX first.
    await mdxTransformer.transform(props)
  );
};
