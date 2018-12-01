'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';

export class Tag {

    constructor(
        public readonly name: string,
        public readonly text: string,
        public readonly filepath: string,
        public readonly start: vscode.Position,
        public readonly end: vscode.Position
    ) {}

    // find will open a tag in the editor
    public go(): void {

        let options: vscode.TextDocumentShowOptions = {
            selection: new vscode.Range(this.end, this.end)
        };

        log.Info(`Jumping to tag in file: '${this.filepath}' at line: ${this.start.line + 1}...`);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(this.filepath), options);
    }
}
