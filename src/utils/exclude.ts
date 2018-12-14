'use_strict';

import * as vscode from 'vscode';
import * as minimatch from 'minimatch';

// isConfigFile returns whether or not the file is a config file
export function isConfigFile(uri: vscode.Uri): boolean {
    return new RegExp(/^(?:\\\d+\\.*|.*settings.json|.*.vscode)$/).test(uri.fsPath);
}

export function isIncludedFile(uri: vscode.Uri, include: string): boolean {
    return minimatch.match([uri.fsPath], include).length > 0;
}

// isExcluded returns whether or not a file has been excluded 
export function isExcludedFile(uri: vscode.Uri, exclude: string): boolean {
    return minimatch.match([uri.fsPath], exclude).length > 0;
}

// shouldSearchFile returns whether or not tagger should search for tags in a given file
export function shouldSearchFile(uri: vscode.Uri, include: string, exclude: string): boolean {
    return isIncludedFile(uri, include) && !isExcludedFile(uri, exclude) && !isConfigFile(uri);
}

// shouldSearchDocument returns whether or not tagger should search for tags in a given document
export function shouldSearchDocument(document: vscode.TextDocument, include: string, exclude: string): boolean {
    return !document.isUntitled && shouldSearchFile(document.uri, include, exclude);
}