'use strict';

// Libraries
import * as vscode from 'vscode';
import * as functions from './functions';

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    
    // Fetch the tagger settings from the user's config
    var settings = vscode.workspace.getConfiguration('tagger');

    // Display a list of tags
    let cmdRefresh = vscode.commands.registerCommand('tagger.refresh', () => {

        // Fetch a list of tags
        var tags = functions.findTags(settings.patterns);
    });

    // Push all the commands
    context.subscriptions.push(cmdRefresh);
}

// Deactivate the extension
export function deactivate() {
}
