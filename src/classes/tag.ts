'use strict';

import * as vscode from 'vscode';

export class Tag {
    constructor(
        public readonly name: string,
        public readonly text: string,
        public readonly filepath: string,
        public readonly start: vscode.Position,
        public readonly end: vscode.Position,
    ) {}
}