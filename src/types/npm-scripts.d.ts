/**
 * the type definition about npm scripts
 * @author: Ruan Jiazhen
 * @date: 2024-09-01 12:41:01
 **/

/**
 * single npm script
 */
type NpmScript = {
    /**
     * the name of the npm script
     * @example: "package"
     */
    name: string;
    /**
     * the command of the npm script
     * @example: "webpack --mode production --devtool hidden-source-map"
     */
    command: string;
};

/**
 * npm scripts of a package.json file
 */
type PackageJsonScripts = {
    packageJsonPath: string;
    scriptList: NpmScript[];
};

/**
 * npm scripts of multiple package.json files
 */
type PackageJsonScriptsList = PackageJsonScripts[];

/**
 * extended QuickPickItem for npm scripts
 */
type NpmScriptQuickPickItem = import('vscode').QuickPickItem &
    NpmScript & {
        /** the path of the package.json file */
        packageJsonPath: string;
    };
