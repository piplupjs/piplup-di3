// @ts-check
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolves and returns the workspace root directory.
 *
 * @returns {string} Absolute path to the workspace root directory.
 *
 * @example
 * const root = getWorkspaceRoot();
 * console.log(root);
 */
export const getWorkspaceRoot = () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  return resolve(dir, '..');
};

const workspaceRoot = getWorkspaceRoot();

/**
 * Executes a system command synchronously.
 *
 * Runs a command using Node.js spawnSync and optionally inherits
 * the current process stdio or captures the output.
 *
 * @param {string} cmd - Command to execute.
 * @param {string[]} args - Command arguments.
 * @param {object} [options] - Execution options.
 * @param {string} [options.cwd=workspaceRoot] - Working directory.
 * @param {boolean} [options.silent=false] - Capture output instead of printing.
 *
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 *
 * @throws {Error} If the command fails.
 */
export const exec = (cmd, args, { cwd = workspaceRoot, silent = false } = {}) => {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: silent ? 'pipe' : 'inherit',
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}\n${result.stderr ?? ''}`);
  }

  return result;
};

/**
 * Reads and parses a JSON file.
 *
 * @template T
 * @param {string} file - JSON file path.
 *
 * @returns {Promise<T>}
 *
 * @throws {Error} If file reading or JSON parsing fails.
 */
export const readJson = async (file) => {
  const content = await readFile(file, 'utf8');

  return JSON.parse(content);
};

/**
 * Writes data as formatted JSON.
 *
 * @param {string} file - Target JSON file path.
 * @param {unknown} data - Data to serialize.
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} If writing or serialization fails.
 */
export const writeJson = async (file, data) => {
  const content = `${JSON.stringify(data, null, 2)}\n`;

  await writeFile(file, content, 'utf8');
};
