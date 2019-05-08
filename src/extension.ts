'use strict';

import * as vscode from 'vscode';
import { Tagger } from './classes';

// Activate the extension
export function activate(context: vscode.ExtensionContext) {

    // Create a new instance of Tagger
    let tagger: Tagger = new Tagger();

    // Register commands and listeners
    tagger.registerCommands(context);
    tagger.registerListeners(context);

    // Refresh everything
    tagger.update().then(() => {
        tagger.refresh();
    });
}

// Deactivate the extension
export function deactivate() {
}
