'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern, Tags } from './';

export class Decorator {

    constructor(
        private patterns: Pattern[]
    ) {
        log.Info("Creating Decorator...");
    }

    // setPatterns will set the patterns variable
    public setPatterns(patterns: Pattern[]): void {
        this.patterns = patterns;
    }

    // refresh will decorate the active text editor by highlighting tags
    public refresh(editor: vscode.TextEditor, tags: Map<string, Tags>): void {

        log.Refresh("decorations", `${editor.document.uri.fsPath} ---`);

        // Init
        let ranges: vscode.Range[];
        
        // Loop through the patterns
        for (let pattern of this.patterns) {

            // Init
            ranges = [];

            // Loop through the tags
            for (let tag of tags.get(pattern.name) || []) {
                ranges.push(new vscode.Range(tag.start, tag.end));
            }

            // Set the decorations
            editor.setDecorations(pattern.textEditorDecorationType, ranges);
        }
    }
}