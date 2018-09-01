import { parse } from 'graphql';

import { loadSchema } from 'apollo-codegen-core/lib/loading';
const schema = loadSchema(require.resolve('../../../common-test/fixtures/starwars/schema.json'));
const miscSchema = loadSchema(require.resolve('../../../common-test/fixtures/misc/schema.json'));

import { compileToIR, CompilerOptions, CompilerContext } from 'apollo-codegen-core/lib/compiler';

import { generateLocalSource, generateGlobalSource } from '../newCodeGeneration';

function compile(
  source: string,
  options: CompilerOptions = {
    mergeInFieldsFromFragmentSpreads: true,
    addTypename: false
  }
): CompilerContext {
  const document = parse(source);
  return compileToIR(schema, document, options);
}

function compileMisc(
  source: string,
  options: CompilerOptions = {
    mergeInFieldsFromFragmentSpreads: true,
    addTypename: false
  }
): CompilerContext {
  const document = parse(source);
  return compileToIR(miscSchema, document, options);
}

describe('Typescript newCodeGeneration', () => {
  test('simple hero query', () => {
    const context = compile(`
      query HeroName($episode: Episode) {
        hero(episode: $episode) {
          name
          id
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('simple mutation', () => {
    const context = compile(`
      mutation ReviewMovie($episode: Episode, $review: ReviewInput) {
        createReview(episode: $episode, review: $review) {
          stars
          commentary
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('simple fragment', () => {
    const context = compile(`
      fragment SimpleFragment on Character {
        name
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('fragment with fragment spreads', () => {
    const context = compile(`
      fragment SimpleFragment on Character {
        name
      }

      fragment AnotherFragment on Character {
        id
        ...SimpleFragment
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('fragment with fragment spreads with inline fragment', () => {
    const context = compile(`
      fragment SimpleFragment on Character {
        name
      }

      fragment AnotherFragment on Character {
        id
        ...SimpleFragment

        ... on Human {
          appearsIn
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('query with fragment spreads', () => {
    const context = compile(`
      fragment SimpleFragment on Character {
        name
      }

      query HeroFragment($episode: Episode) {
        hero(episode: $episode) {
          ...SimpleFragment
          id
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('inline fragment', () => {
    const context = compile(`
      query HeroInlineFragment($episode: Episode) {
        hero(episode: $episode) {
          ... on Character {
            name
          }
          id
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('inline fragment on type conditions', () => {
    const context = compile(`
      query HeroName($episode: Episode) {
        hero(episode: $episode) {
          name
          id

          ... on Human {
            homePlanet
            friends {
              name
            }
          }

          ... on Droid {
            appearsIn
          }
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('inline fragment on type conditions with differing inner fields', () => {
    const context = compile(`
      query HeroName($episode: Episode) {
        hero(episode: $episode) {
          name
          id

          ... on Human {
            homePlanet
            friends {
              name
            }
          }

          ... on Droid {
            appearsIn
            friends {
              id
            }
          }
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('fragment spreads with inline fragments', () => {
    const context = compile(`
      query HeroName($episode: Episode) {
        hero(episode: $episode) {
          name
          id
          ...HumanFragment
          ...DroidFragment
        }
      }

      fragment HumanFragment on Human {
        homePlanet
        friends {
          ... on Human {
            name
          }

          ... on Droid {
            id
          }
        }
      }

      fragment DroidFragment on Droid {
        appearsIn
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('handles multiline graphql comments', () => {
    const context = compileMisc(`
      query CustomScalar {
        commentTest {
          multiLine
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('multiple nested non-null list enum', () => {
    const context = compileMisc(`
      query nesting {
        nesting {
          propA
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('multiple nested list enum', () => {
    const context = compileMisc(`
      query nesting {
        nesting {
          propB
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });

  test('duplicates', () => {
    const context = compileMisc(`
      mutation duplicates($a: EnumCommentTestCase!, $b: EnumCommentTestCase!, $c: Duplicate!) {
        duplicates(a: $a, b: $b, c: $c) {
          propA
          propB
        }
      }
    `);

    const output = generateLocalSource(context).map(f => ({
      ...f,
      content: f.content({
        outputPath: '/some/file/ComponentA.tsx',
        globalSourcePath: '/__generated__/globalTypes.ts'
      })
    }));
    expect(output).toMatchSnapshot();
    expect(generateGlobalSource(context)).toMatchSnapshot();
  });
});
