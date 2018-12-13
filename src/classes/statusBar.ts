'use strict';

import * as vscode from 'vscode';
import * as log from '../log';

export class StatusBar {

    constructor() {
        log.Info("Creating StatusBar...");
    }

    // refresh will update the tag count displayed in the status bar
    public refresh(count: number) {

        log.Refresh("status bar");

        vscode.window.setStatusBarMessage(`$(tag) ${count}`);
    }
}
