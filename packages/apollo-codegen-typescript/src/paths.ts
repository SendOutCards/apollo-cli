import * as path from 'path';

const unadjustedRelativePath = (from: string, to: string) =>
  path.relative(path.dirname(from), path.join(path.dirname(to), path.basename(to, '.ts')));

// Have to manually add ./ when relative path is to file in the same directory.
const adjustedRelativePath = (path: string) => (path.startsWith('.') ? path : `./${path}`);

export const relativePath = (from: string, to: string) =>
  adjustedRelativePath(unadjustedRelativePath(from, to));

export const outputPath = (fragmentOrOperationName: string, filePath: string) =>
  path.join(path.join(path.dirname(filePath), '__generated__'), fragmentOrOperationName + '.ts');
