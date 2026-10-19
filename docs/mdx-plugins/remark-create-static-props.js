import { parse } from 'acorn';

// AST transformer adds `getStaticProps` to the tree based on provided mapping.
// When remark-api-section-data collected API reference data for the page, it is
// merged into the props so it reaches hydration through `__NEXT_DATA__` instead
// of the client JS bundles.
export default function createNextStaticProps(map) {
  return function transformer(tree, file) {
    const apiSectionData = file.data?.apiSectionDataExpression;
    const props = apiSectionData ? `{ ...(${map}), apiSectionData: ${apiSectionData} }` : map;
    tree.children.push({
      type: 'mdxjsEsm',
      data: {
        estree: parse(`export const getStaticProps = () => ({ props: ${props} });`, {
          sourceType: 'module',
          ecmaVersion: 2022,
        }),
      },
    });
  };
}
