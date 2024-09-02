/**
 * the store of npm scripts
 * @author: Ruan Jiazhen
 * @date: 2024-09-01 12:26:31
 **/

import {
    getNpmScriptFromPackageJson,
    getPackageJsonPathList,
    workspaceRootUri,
} from '../read-npm-scripts';
import * as vscode from 'vscode';
import { debounce } from '../utils/debounce';

/**
 * promise that indicates whether init package.json scripts list is done
 */
let allNpmScriptPromise: Promise<void> | null = null;

/**
 * all package.json scripts list
 */
let packageJsonScriptsList: PackageJsonScriptsList = [];

// XXX optimize the performance by only update single package.json script list
/**
 * start to watch package.json changes, and update package.json scripts list when package.json changes
 */
export function watchPackageJsonChanges() {
    const packageJsonWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRootUri || '', '**/package.json')
    );

    packageJsonWatcher.onDidChange(initPackageJsonScriptsList);
    packageJsonWatcher.onDidCreate(initPackageJsonScriptsList);
    packageJsonWatcher.onDidDelete(initPackageJsonScriptsList);
}

/**
 * init package.json scripts list
 */
export const initPackageJsonScriptsList = debounce(async function () {
    let resolveAllNpmScriptPromise = () => {};
    allNpmScriptPromise = new Promise((resolve) => {
        resolveAllNpmScriptPromise = resolve;
    });

    const packageJsonPathList = await getPackageJsonPathList();

    packageJsonScriptsList = await Promise.all(
        packageJsonPathList.map(async (packageJsonPath) => {
            const scriptList = await getNpmScriptFromPackageJson(packageJsonPath);
            return {
                packageJsonPath,
                scriptList,
            };
        })
    );

    resolveAllNpmScriptPromise();
    allNpmScriptPromise = null;
    getQuickPickItemList(true);
});

/** the quick pick item list only sorted by package.json path */
let quickPickItemList: NpmScriptQuickPickItem[] | null = null;

/** the quick pick item list shown in quick pick */
let shownQuickPickItemList: NpmScriptQuickPickItem[] | null = null;

/**
 * the function to get quick pick item list based on packageJsonScriptsList
 * @param isInit whether to init the quick pick item list
 */
export async function getQuickPickItemList(isInit = false): Promise<NpmScriptQuickPickItem[]> {
    if (allNpmScriptPromise && !isInit) {
        await allNpmScriptPromise;
    }

    if (shownQuickPickItemList && !isInit) {
        return shownQuickPickItemList;
    }

    const flattenedScriptList = packageJsonScriptsList.flatMap((packageJson) =>
        packageJson.scriptList.map((script) => ({
            ...script,
            packageJsonPath: packageJson.packageJsonPath,
        }))
    );

    quickPickItemList = flattenedScriptList
        .map((item) => {
            const relativeRunPath = item.packageJsonPath
                .replace(workspaceRootUri?.fsPath + '\\', '')
                .replace(/package\.json$/, '')
                .replace(/\\$/, '')
                .replace(/\\/g, '/');

            const label = `${item.name}${relativeRunPath ? ` - ${relativeRunPath}` : ''}`;

            return {
                label,
                detail: item.command,
                ...item,
            };
        })
        // sort by package.json path
        .sort((a, b) => {
            const packageJsonPathCompare = a.packageJsonPath.localeCompare(b.packageJsonPath);

            return packageJsonPathCompare;
        });

    shownQuickPickItemList = quickPickItemList;

    return shownQuickPickItemList;
}

type SetQuickPickItemToFirstConfig = {
    /** description prefix of the item to set to first */
    descriptionPrefix: string;
};
/**
 * set one quick pick item to first
 * @param item the quick pick item to set to first
 * @param config the config to set
 */
export async function setQuickPickItemToFirst(
    item: NpmScriptQuickPickItem,
    config?: SetQuickPickItemToFirstConfig
) {
    if (!shownQuickPickItemList || !quickPickItemList) {
        throw new Error('quickPickItemList is not initialized');
    }

    const { descriptionPrefix }: SetQuickPickItemToFirstConfig = {
        descriptionPrefix: '(last used)',
        ...config,
    };

    // set the item to first and update the description
    shownQuickPickItemList = quickPickItemList
        .toSorted((a, _) => {
            const isMatch = a.packageJsonPath === item.packageJsonPath && a.name === item.name;

            return isMatch ? -1 : 0;
        })
        .map((quickPickItem, index) => {
            return {
                ...quickPickItem,
                description:
                    index === 0
                        ? quickPickItem.description
                            ? `${descriptionPrefix} ${quickPickItem.description}`
                            : descriptionPrefix
                        : quickPickItem.description,
            };
        });
}
