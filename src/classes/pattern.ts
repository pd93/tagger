'use strict';

import * as vscode from 'vscode';

// export interface Pattern {
//     name: string;
//     pattern: string;
//     include: string;
//     exclude: string;
//     caseSensitive: boolean;
//     decoration: vscode.TextEditorDecorationType;
// }

export class Pattern {

    constructor(
        public name: string,
        pattern: string,
        caseSensitive: boolean,
        style: vscode.DecorationRenderOptions
    ) {
        // Create a new RegExp object
        if (caseSensitive) {
            this.regexp = new RegExp(pattern, 'g');
        } else {
            this.regexp = new RegExp(pattern, 'gi');
        }

        // Create the TextEditorDecorationType
        this.textEditorDecorationType = vscode.window.createTextEditorDecorationType(style);
    }

    public regexp: RegExp;
    public textEditorDecorationType: vscode.TextEditorDecorationType;
}