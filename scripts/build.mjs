#!/usr/bin/env node

// @ts-check

import { promises as fs } from 'node:fs';
import { join, relative, dirname } from 'node:path';

import Table from 'cli-table3';
import esbuild from 'esbuild';
import fg from 'fast-glob';
import { filesize } from 'filesize';
import { gzipSize } from 'gzip-size';

import { getWorkspaceRoot, exec } from './utils.mjs';

/**
 * @typedef {Object} BuildConfig
 * @property {string} workspaceRoot
 * @property {string} distDirectory
 * @property {string} workspacePackageJson
 * @property {string} distPackageJson
 * @property {string} distEntryFileName
 */

/**
 * @typedef {Object} BuildFileStat
 * @property {string} file
 * @property {string} size
 * @property {string} gzip
 */

const workspaceRoot = getWorkspaceRoot();

/** @type {BuildConfig} */
const config = {
  get distDirectory() {
    return join(this.workspaceRoot, 'dist');
  },
  distEntryFileName: 'index',
  get distPackageJson() {
    return join(this.distDirectory, 'package.json');
  },
  get workspacePackageJson() {
    return join(this.workspaceRoot, 'package.json');
  },
  workspaceRoot,
};

/**
 * Runs project cleanup script.
 *
 * @returns {Promise<unknown>}
 */
const runCleanup = async () => {
  return exec('pnpm', ['cleanup'], {
    cwd: config.workspaceRoot,
  });
};

/**
 * Collects build output size statistics.
 *
 * @returns {Promise<{
 * files: BuildFileStat[],
 * total: number,
 * gzipTotal: number
 * }>}
 */
const getBuildStats = async () => {
  const files = await fg(['**/*.js', '**/*.d.ts', '**/*.json', 'LICENSE', 'README.md'], {
    absolute: true,
    cwd: config.distDirectory,
    onlyFiles: true,
  });

  let total = 0;
  let gzipTotal = 0;

  const stats = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file);

      const size = content.length;
      const gzip = await gzipSize(content);

      total += size;
      gzipTotal += gzip;

      return {
        file: relative(config.distDirectory, file),
        gzip: filesize(gzip),
        size: filesize(size),
      };
    }),
  );

  return {
    files: stats.sort((a, b) => a.file.localeCompare(b.file)),
    gzipTotal,
    total,
  };
};

/**
 * Creates build statistics table.
 *
 * @param {Awaited<ReturnType<typeof getBuildStats>>} stats
 *
 * @returns {string}
 */
const createStatsTable = (stats) => {
  const table = new Table({
    head: ['File', 'Size', 'Gzip'],
  });

  for (const item of stats.files) {
    table.push([item.file, item.size, item.gzip]);
  }

  return table.toString();
};

/**
 * Builds npm package.
 *
 * @returns {Promise<void>}
 */
const build = async () => {
  await runCleanup();

  const entryPoints = await fg(['src/**/*.ts'], {
    absolute: true,
    cwd: config.workspaceRoot,
    ignore: ['**/*.test.ts'],
  });

  // Compile ESM
  await esbuild.build({
    entryPoints,
    format: 'esm',
    outbase: 'src',
    outdir: config.distDirectory,
    platform: 'node',
    target: 'node16',
  });

  // Compile CJS
  await esbuild.build({
    entryPoints,
    format: 'cjs',
    outbase: 'src',
    outdir: join(config.distDirectory, 'cjs'),
    platform: 'node',
    target: 'node16',
  });

  // Generate type declarations
  exec('tsc', ['-p', 'tsconfig.build.json'], {
    cwd: config.workspaceRoot,
  });

  // Copy type declarations to CJS directory
  const dtsFiles = await fg(['**/*.d.ts'], {
    absolute: true,
    cwd: config.distDirectory,
  });
  await Promise.all(
    dtsFiles.map(async (file) => {
      const relPath = relative(config.distDirectory, file);
      const destPath = join(config.distDirectory, 'cjs', relPath);
      await fs.mkdir(dirname(destPath), { recursive: true });
      await fs.copyFile(file, destPath);
    }),
  );

  // Create package.json inside dist/cjs/ to specify CommonJS
  const cjsDirectory = join(config.distDirectory, 'cjs');
  await fs.mkdir(cjsDirectory, { recursive: true });
  await fs.writeFile(
    join(cjsDirectory, 'package.json'),
    `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
    'utf8',
  );

  const workspacePackageJson = JSON.parse(await fs.readFile(config.workspacePackageJson, 'utf8'));
  const distPackage = { ...workspacePackageJson };

  distPackage.main = `./cjs/${config.distEntryFileName}.js`;
  distPackage.module = `./${config.distEntryFileName}.js`;
  distPackage.types = `./${config.distEntryFileName}.d.ts`;
  distPackage.exports = {
    '.': {
      import: {
        default: `./${config.distEntryFileName}.js`,
        types: `./${config.distEntryFileName}.d.ts`,
      },
      require: {
        default: `./cjs/${config.distEntryFileName}.js`,
        types: `./cjs/${config.distEntryFileName}.d.ts`,
      },
    },
  };

  delete distPackage.files;
  delete distPackage.private;
  delete distPackage.scripts;
  delete distPackage.devDependencies;
  delete distPackage.packageManager;

  await fs.writeFile(config.distPackageJson, `${JSON.stringify(distPackage, null, 2)}\n`, 'utf8');

  const filesToCopy = ['LICENSE', 'README.md'];
  await Promise.all(
    filesToCopy.map(async (file) => {
      const srcPath = join(config.workspaceRoot, file);
      try {
        await fs.access(srcPath);
        await fs.copyFile(srcPath, join(config.distDirectory, file));
      } catch {
        // ignore if file doesn't exist
      }
    }),
  );

  const stats = await getBuildStats();

  console.log('\n✔ Build complete\n');

  console.log(`Output: ${relative(config.workspaceRoot, config.distDirectory)}\n`);

  console.log(createStatsTable(stats));

  console.log('\nSummary');

  console.log(`Total      : ${filesize(stats.total)}`);

  console.log(`Gzip total : ${filesize(stats.gzipTotal)}`);

  console.log();
};

/**
 * CLI entry point.
 *
 * @returns {Promise<void>}
 */
const main = async () => {
  try {
    await build();
  } catch (error) {
    console.error('\n✖ Build failed\n');

    console.error(error instanceof Error ? error.message : String(error));

    process.exit(1);
  }
};

main();
