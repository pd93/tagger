'use strict';

import * as vscode from 'vscode';
import * as structures from './structures';

// GetSettings will fetch the workspace configuration settings and place them in a settings structure
export function getSettings(): structures.Settings {
    
    // Get the workspace config
    let config = vscode.workspace.getConfiguration("tagger");

    // Assign the settings or their defaults
    let settings: structures.Settings = {
        updateOn: config.get("updateOn") || "change",
        include: config.get("include") || "**/*",
        exclude: config.get("exclude") || "",
        maxResults: config.get("maxResults") || 100,
        patterns: config.get("patterns") || []
    };

    return settings;
}

// FindTags will scan a given text document for matches to a single tag pattern
export function findTags(pattern: structures.Pattern, document: vscode.TextDocument): structures.Tag[] {

    console.log(`Finding tags for pattern: '${pattern.name}'...`);

    // Init
    let tags: structures.Tag[] = [];
    let match: RegExpExecArray | null;
    let re;
    
    // Create a new regex object
    if (pattern.caseSensitive) {
        re = new RegExp(pattern.pattern, 'g');
    } else {
        re = new RegExp(pattern.pattern, 'gi');
    }

    // Loop through all the matches and add them to an array
    while (match = re.exec(document.getText())) {
        tags.push({
            name: pattern.name,
            text: match[0],
            filepath: document.uri.fsPath,
            start: document.positionAt(match.index),
            end: document.positionAt(match.index + match[0].length)
        });
    }

    console.log(tags);

    return tags;
}

export function createDecorationTypes(patterns: structures.Pattern[]): Map<string, vscode.TextEditorDecorationType> {

    console.log("Creating decoration types...");

    // Init
    let decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

    // Loop through the patterns and add the styles
    for (let pattern of patterns) {
        decorationTypes.set(pattern.name, vscode.window.createTextEditorDecorationType(pattern.style));
    }

    return decorationTypes;
}

// Decorate will decorate the active text editor by highlighting tags
export function decorate(patterns: structures.Pattern[], decorationTypes: Map<string, vscode.TextEditorDecorationType>) {
    
    console.log("Decorating editor...");

    // Init
    let editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document) {
        return;
    }
    
    // Loop through the patterns
    for (let pattern of patterns) {

        // Init
        let ranges: vscode.Range[] = [];
    
        // Fetch the tags in the active editor
        let tags = findTags(pattern, editor.document);

        // Loop through the tags
        for (let tag of tags) {
            ranges.push(new vscode.Range(tag.start, tag.end));
        }

        // Get the decoration type
        let decorationType = decorationTypes.get(pattern.name);
        if (!decorationType) {
            throw new Error(`No decoration type found for pattern: '${pattern.name}'`);
        }

        // Set the decorations
        editor.setDecorations(decorationType, ranges);
    }
}