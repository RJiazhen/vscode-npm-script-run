/**
 * @description: Check if.nvmrc file exists in the current directory
 * @author: Ruan Jiazhen
 * @date: 2024-09-03 08:23:41
 **/
import { existsSync } from 'fs';
import { Uri, window } from 'vscode';

/**
 * Check if.nvmrc file exists in the current directory
 * @param path current directory path, like "e:\Projects\vscode-npm-script-run\"
 * @returns true if.nvmrc file exists, false otherwise
 */
export function checkIsNvmrcExit(path: string): boolean {
    const nvmrcPath = `${path}.nvmrc`;
    return existsSync(nvmrcPath);
}
