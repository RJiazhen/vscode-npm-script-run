import * as vscode from 'vscode';
import {
    getQuickPickItemList,
    initPackageJsonScriptsList,
    setQuickPickItemToFirst,
    watchPackageJsonChanges,
} from './stores/npm-scripts-store';

function openScriptInTerminal(
    terminal: vscode.Terminal | undefined,
    selectedNpmScript: NpmScriptQuickPickItem
): void {
    if (terminal) {
        terminal.show();
        const workPath = selectedNpmScript.packageJsonPath.replace('package.json', '');
        terminal.sendText(`cd ${workPath}`);
        const npmCommand = `npm run ${selectedNpmScript.label}`;
        terminal.sendText(npmCommand);
    } else {
        vscode.window.showInformationMessage('No active terminal. Exiting...');
    }
}

async function readNpmScriptsMain(openNewTerminal: boolean): Promise<void> {
    // TODO show "Loading..." before getting the quickPickItemList
    const quickPickItemList = await getQuickPickItemList();

    const selectedNpmScript = await vscode.window.showQuickPick(quickPickItemList);

    if (!selectedNpmScript) {
        vscode.window.showInformationMessage('You did not select an npm script. Exiting...');
        return;
    }
    setQuickPickItemToFirst(selectedNpmScript);

    let terminal: vscode.Terminal | undefined;
    if (openNewTerminal) {
        terminal = vscode.window.createTerminal();
    } else {
        terminal = vscode.window.activeTerminal;
    }

    openScriptInTerminal(terminal, selectedNpmScript);
}

export async function activate(context: vscode.ExtensionContext) {
    initPackageJsonScriptsList();
    watchPackageJsonChanges();

    let runNpmScriptCurrentTerminal = vscode.commands.registerCommand(
        'elltg-npm-script-run.runNpmScriptCurrentTerminal',
        async () => {
            await readNpmScriptsMain(false);
        }
    );
    context.subscriptions.push(runNpmScriptCurrentTerminal);

    let runNpmScriptNewTerminal = vscode.commands.registerCommand(
        'elltg-npm-script-run.runNpmScriptNewTerminal',
        async () => {
            await readNpmScriptsMain(true);
        }
    );
    context.subscriptions.push(runNpmScriptNewTerminal);
}

export function deactivate() {}
