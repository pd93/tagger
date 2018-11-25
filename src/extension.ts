'use strict';

// Libraries
import * as vscode from 'vscode';
import * as activitybar from './activitybar';

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    
    // Fetch the tagger settings from the user's config
    var settings = vscode.workspace.getConfiguration('tagger');

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
    // Commands
    //

    // Push all the commands
    context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', refresh));
}

// Deactivate the extension
export function deactivate() {
}
