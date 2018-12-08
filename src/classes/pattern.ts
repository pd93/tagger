'use strict';

import * as vscode from 'vscode';
import { SVG } from './';

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

        // Create a coloured SVG icon for this pattern
        this.svg = new SVG(this.name, style.backgroundColor);
    }

    public regexp: RegExp;
    public textEditorDecorationType: vscode.TextEditorDecorationType;
    public svg: SVG;
}