'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern, Tag } from './';

export class Decorator {

    constructor(
        private patterns: Pattern[]
    ) {
        log.Info("Creating Decorator...");
        
        // Set the decoration types
        this.updateDecorationTypes();
    }

    // Variables
    private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

    // setPatterns will set the patterns variable
    public setPatterns(patterns: Pattern[]): void {
        this.patterns = patterns;
        this.updateDecorationTypes();
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

            // Get the decoration type
            let decorationType = this.decorationTypes.get(pattern.name);
            if (!decorationType) {
                throw new Error(`No decoration type found for pattern: '${pattern.name}'`);
            }

            // Set the decorations
            editor.setDecorations(decorationType, ranges);
        }
    }

    //
    // Helpers
    //

    // updateDecorationTypes will update the decorations for each pattern
    private updateDecorationTypes(): void {

        log.Info("Creating decoration types...");

        // Init
        this.decorationTypes = new Map();
    
        // Loop through the patterns and add the styles
        for (let pattern of this.patterns) {
            this.decorationTypes.set(pattern.name, vscode.window.createTextEditorDecorationType(pattern.style));
        }
    }
}