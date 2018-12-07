'use strict';

import * as vscode from 'vscode';

export class Pattern {

    constructor(
        public name: string,
        pattern: string,
        flags: string,
        style: vscode.DecorationRenderOptions
    ) {
        
        // Create a new RegExp object
        this.regexp = new RegExp(pattern, flags);

        // Create the TextEditorDecorationType
        this.textEditorDecorationType = vscode.window.createTextEditorDecorationType(style);
    }

    public regexp: RegExp;
    public textEditorDecorationType: vscode.TextEditorDecorationType;
}