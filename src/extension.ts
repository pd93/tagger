'use strict';

import * as vscode from 'vscode';
import * as activitybar from './activitybar';
import * as structures from './structures';
import * as utils from './utils';

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    
    // Fetch the tagger settings from the user's config
    var settings: structures.Settings = utils.getSettings();

    //
    // Trees
    //

    // Create a tree data provider
    const taggerTreeDataProvider = new activitybar.TaggerTreeDataProvider(settings.patterns, settings.include, settings.exclude, settings.maxResults);

    // Register the tree view with its data provider
    vscode.window.createTreeView('tagger-tags', { treeDataProvider: taggerTreeDataProvider });

    //
    // Functions
    //

    // Refresh everything
    let refresh = () => {

        console.log('#########################');
        console.log('## ----- Refresh ----- ##');
        console.log('#########################');

        // Refresh the tree view
        taggerTreeDataProvider.refresh();
    };

    //
    // Listeners
    //

    if (settings.updateOn === "change") {

        // Listen to document change events
        vscode.workspace.onDidChangeTextDocument(event => {
            if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                refresh();
            }
        }, null, context.subscriptions);

    } else if (settings.updateOn === "save") {

        // Listen to save document events
        vscode.workspace.onDidSaveTextDocument(event => {
            refresh();
        }, null, context.subscriptions);
    }

    //
    // Commands
    //

    // Push all the commands
    context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', refresh));
}

// Deactivate the extension
export function deactivate() {
}
