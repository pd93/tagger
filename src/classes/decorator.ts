'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern, Tag } from './';

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
    public refresh(tags: Map<string, Tag[]>): void {

        log.Info("--- refreshing decorations ---");

        // Init
        let ranges: vscode.Range[];
        let editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return;
        }
        
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