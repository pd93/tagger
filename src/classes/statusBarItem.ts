'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';

export class StatusBarItem {

    constructor() {
        log.Info("Creating StatusBarItem...");
    }

    // refresh will update the tag count displayed in the status bar
    public refresh(count: number) {

        log.Refresh("status bar");

        vscode.window.setStatusBarMessage(`$(tag) ${count}`);
    }
}

