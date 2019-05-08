'use_strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import * as minimatch from 'minimatch';
import { IFiles } from '../classes';

// isConfigFile returns whether or not the file is a config file
export function isConfigFile(uri: vscode.Uri): boolean {
    return new RegExp(/^((\\|\/)\d+(\\|\/).*|.*settings\.json|.*\.vscode((\\|\/).*)?|.*\.git((\\|\/).*)?)$/).test(uri.fsPath);
}

// isGitIgnoredFile checks is a file is ignored by git
export function isGitIgnoredFile(uri: vscode.Uri): boolean {
    try {
        if (vscode.workspace.rootPath) {
            let cwd = vscode.workspace.rootPath;
            let cmd = `git check-ignore "${uri.fsPath.replace(/\\/g, "/")}"`;
            let stdout = child_process.execSync(cmd, {cwd: cwd}).toString();
            if (stdout) {
                return true;
            }
        }
        return false;
    } catch (err) {
        return false;
    }
}

// inIncludedFile returns whether or not a file has been included
export function isIncludedFile(uri: vscode.Uri, include: string): boolean {
    return match(uri.fsPath, include);
}

// isExcludedFile returns whether or not a file has been excluded
export function isExcludedFile(uri: vscode.Uri, exclude: string): boolean {
    return match(uri.fsPath, exclude);
}

// shouldSearchFile returns whether or not tagger should search for tags in a given file
export function shouldSearchFile(uri: vscode.Uri, options: IFiles): boolean {

    // Exclude config files if setting enabled
    if (options.excludeConfigFiles && isConfigFile(uri)) {
        return false;
    }

    // Exclude files ignored by git if setting enabled
    if (options.excludeGitIgnoredFiles && isGitIgnoredFile(uri)) {
        return false;
    }

    // Check if the file is literally included/excluded
    if (options.exclude !== undefined && options.include !== undefined) {
        let include = isIncludedFile(uri, options.include) && !isExcludedFile(uri, options.exclude);
        return include;
    }

    return true;
}

// shouldSearchDocument returns whether or not tagger should search for tags in a given document
export function shouldSearchDocument(document: vscode.TextDocument, options: IFiles): boolean {
    return !document.isUntitled && shouldSearchFile(document.uri, options);
}

// isFileOpen checks whether a given file is currently open in vscode
export function isFileOpen(uri: vscode.Uri): boolean {
    let editors = vscode.window.visibleTextEditors;
    for (let editor of editors) {
        if (uri.fsPath === editor.document.uri.fsPath) {
            return true;
        }
    }
    return false;
}

// dirAsGlob will return a glob pattern to match files in a given directory
export function dirAsGlob(uri: vscode.Uri): string {
    let workspaceDir = vscode.workspace.rootPath || "";
    let pathFromWorkspace = uri.fsPath.replace(workspaceDir, "").replace("\\", "/");
    return `**${pathFromWorkspace}/*`;
}

// match will return whether or not a filepath matches a glob pattern
export function match(filepath: string, glob: string): boolean {

    // Format paths to use '/' instead of '\' and remove windows drive letters
    filepath = filepath.replace(/\\/g, "/").replace(/[a-zA-Z]:/, "");

    return minimatch.match([filepath], glob).length === 1;
}
