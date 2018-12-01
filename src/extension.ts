'use strict';

import * as vscode from 'vscode';
import * as log from './utils/log';
import { Tagger } from './classes/tagger';
import { TaggerTreeDataProvider } from './classes/taggerTreeDataProvider'

// Activate the extension
export function activate(context: vscode.ExtensionContext) {

    // Create a new instance of Tagger
    var tagger: Tagger = new Tagger();

    //
    // Trees
    //

    // Create a tree data provider
    const taggerTreeDataProvider = new TaggerTreeDataProvider(tagger);

    // Register the tree view with its data provider
    vscode.window.createTreeView('tagger-tags', {
        treeDataProvider: taggerTreeDataProvider
    });

    //
    // Functions
    //

    // Refresh the decorations in the active editor
    let refreshDecorations = () => {
        log.Info("--- updating decorations ---");
        tagger.decorate();
    };

    // Refresh the listed tags in the tagger tree view
    let refreshTreeView = () => {
        log.Info("--- updating tree view ---");
        taggerTreeDataProvider.refresh();
    };

    // Refresh everything
    let refresh = async () => {

        // Update all the tags
        await tagger.updateTags();

        // Update the tree view and decorations
        refreshTreeView();
        refreshDecorations();
    };

    //
    // Listeners
    //

    switch (tagger.settings.updateOn) {

        // Listen to document change events
        case "change":

            vscode.workspace.onDidChangeTextDocument(event => {

                // Update tags for the file that changed
                tagger.updateTagsForDocument(event.document);

                // Refresh the tree view
                refreshTreeView();

                // If the file tht changed is currently open, update the decorations too
                if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                    refreshDecorations();
                }

            }, null, context.subscriptions);

            break;

        // Listen to save document events
        case "save":

            vscode.workspace.onDidSaveTextDocument(event => {

                // Update tags for the file that changed
                tagger.updateTagsForFile(event.uri);

                // Refresh the tree view
                refreshTreeView();

                // If the file tht changed is currently open, update the decorations too
                if (vscode.window.activeTextEditor && event.fileName === vscode.window.activeTextEditor.document.fileName) {
                    refreshDecorations();
                }

            }, null, context.subscriptions);
            break;
    }

    // Listen for when the active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {

        // If the editor is active, refresh the decorations
        if (editor) {
            refreshDecorations();
        }

    }, null, context.subscriptions);

    //
    // Commands
    //

    // Push all the commands
    context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', refresh));
}

// Deactivate the extension
export function deactivate() {
}
