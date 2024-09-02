/**
 * the util function about read package.json file and get npm scripts
 **/
import * as vscode from 'vscode';

interface IPackageFileWithScripts {
    scripts: Record<string, string>;
}

export const workspaceRootUri = vscode.workspace.workspaceFolders?.[0]?.uri;

// XXX Add support for passing in uri parameters
/**
 * get all package.json file path in the workspace
 * @returns list of package.json file path
 */
export async function getPackageJsonPathList(): Promise<string[]> {
    if (!workspaceRootUri) {
        throw new Error('folder needed!');
    }

    const relativePattern = new vscode.RelativePattern(workspaceRootUri, '**/package.json');
    const packageJsonUriList = await vscode.workspace.findFiles(
        relativePattern,
        '**/node_modules/**'
    );

    const packageJsonPathList = packageJsonUriList.map((uri) => uri.fsPath);

    return packageJsonPathList;
}

/**
 * get all npm scripts from package.json file
 * @param packageJsonPath package.json file path
 * @returns list of npm scripts
 */
export async function getNpmScriptFromPackageJson(packageJsonPath: string): Promise<NpmScript[]> {
    if (!packageJsonPath) {
        return [];
    }

    const packageJsonTextDocument = await vscode.workspace.openTextDocument(packageJsonPath);
    const packageJsonTextContents = packageJsonTextDocument.getText();

    const packageJsonScripts = (() => {
        try {
            return JSON.parse(packageJsonTextContents).scripts;
        } catch (e) {
            return {};
        }
    })();

    const packageScriptList = Object.entries(packageJsonScripts).map(([name, command]) => ({
        name,
        command: typeof command === 'string' ? command : '',
    }));

    if (packageScriptList.length === 0) {
        return [];
    }

    return packageScriptList;
}
