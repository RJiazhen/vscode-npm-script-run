import * as vscode from 'vscode';
import {
    getQuickPickItemList,
    initPackageJsonScriptsList,
    setQuickPickItemToFirst,
    watchPackageJsonChanges,
} from './stores/npm-scripts-store';
import { checkIsNvmrcExit } from './utils/checkIsNvmrcExit';

async function openScriptInTerminal(
    terminal: vscode.Terminal | undefined,
    selectedNpmScript: NpmScriptQuickPickItem
) {
    if (terminal) {
        terminal.show();
        const workPath = selectedNpmScript.packageJsonPath.replace('package.json', '');
        terminal.sendText(`cd ${workPath}`);

        const isNvmrcExit = checkIsNvmrcExit(
            selectedNpmScript.packageJsonPath.replace('package.json', '')
        );
        if (isNvmrcExit) {
            const nvmrcPath = selectedNpmScript.packageJsonPath.replace('package.json', '.nvmrc');
            const nvmrcVersion = (await vscode.workspace.openTextDocument(nvmrcPath))
                .getText()
                .trim()
                .replace('v', '');
            terminal.sendText(`nvm use ${nvmrcVersion}`);
        }

        const npmCommand = `npm run ${selectedNpmScript.label}`;
        terminal.sendText(npmCommand);
    } else {
        vscode.window.showInformationMessage('No active terminal. Exiting...');
    }
}

async function readNpmScriptsMain(openNewTerminal: boolean): Promise<void> {
    const quickPick = vscode.window.createQuickPick<
        NpmScriptQuickPickItem | vscode.QuickPickItem
    >();
    quickPick.items = [
        {
            label: 'Loading npm scripts...',
            description: 'Please wait...',
        },
    ];
    quickPick.placeholder = 'Select an npm script to run';
    quickPick.show();

    // FIXME if immediately call after change package.json, quickPick.items will not be updated

    const quickPickItemList = await getQuickPickItemList();

    quickPick.items = quickPickItemList;
    quickPick.placeholder = 'Select an npm script to run';
    const selectedNpmScript = await new Promise<NpmScriptQuickPickItem>((resolve) => {
        quickPick.onDidChangeSelection((e) => {
            resolve(e[0] as NpmScriptQuickPickItem);
        });
    });

    if (!selectedNpmScript) {
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

    context.subscriptions.push(watchPackageJsonChanges());

    let runNpmScriptCurrentTerminal = vscode.commands.registerCommand(
        'rjz-npm-run.runNpmScriptCurrentTerminal',
        async () => {
            await readNpmScriptsMain(false);
        }
    );
    context.subscriptions.push(runNpmScriptCurrentTerminal);

    let runNpmScriptNewTerminal = vscode.commands.registerCommand(
        'rjz-npm-run.runNpmScriptNewTerminal',
        async () => {
            await readNpmScriptsMain(true);
        }
    );
    context.subscriptions.push(runNpmScriptNewTerminal);
}

export function deactivate() {}
