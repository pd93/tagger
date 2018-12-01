'use strict';

import * as vscode from 'vscode';
import { Tagger } from './classes';

// Activate the extension
export function activate(context: vscode.ExtensionContext) {

    // Create a new instance of Tagger
    new Tagger(context);
}

// Deactivate the extension
export function deactivate() {
}
