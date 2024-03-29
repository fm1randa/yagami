import { resolve, join, basename } from 'path';
import fs from 'fs-extra';

const packagePath = process.cwd();
const distPath = join(packagePath, './dist');

const writeJson = (targetPath, obj) =>
  fs.writeFile(targetPath, JSON.stringify(obj, null, 2), 'utf8');

async function createPackageFile() {
  const packageData = await fs.readFile(
    resolve(packagePath, './package.json'),
    'utf8'
  );
  const { scripts, devDependencies, ...packageOthers } =
    JSON.parse(packageData);

  const newPackageData = {
    ...packageOthers,
    main: './index.js',
    types: './index.d.ts'
  };

  delete newPackageData.files;

  const targetPath = resolve(distPath, './package.json');

  await writeJson(targetPath, newPackageData);
  console.log(`Created package.json in ${targetPath}`);
}

async function includeFileInBuild(file) {
  const sourcePath = resolve(packagePath, file);
  const targetPath = resolve(distPath, basename(file));
  await fs.copy(sourcePath, targetPath);
  console.log(`Copied ${sourcePath} to ${targetPath}`);
}

async function run() {
  try {
    await createPackageFile();
    await includeFileInBuild('./README.md');
    await includeFileInBuild('./LICENSE');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
