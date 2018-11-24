'use strict';

// Libraries
import * as vscode from 'vscode';
import * as structures from './structures';

const window = vscode.window;
const editor = window.activeTextEditor;

// FindTags will scan the active text editor for matches to the configured tag patterns
export function findTags(patterns: structures.Pattern[]): structures.Tag[] {

    console.log("Finding tags...");

    if (!editor || !editor.document) {
        return [];
    }

    // Init
    let tags: structures.Tag[] = [];
    let re: RegExp;

    // Get the document text
    let text = editor.document.getText();

    // Loop through each tag
    for (let i = 0; i < patterns.length; i++) {

        let pattern: structures.Pattern = patterns[i];
        let match: RegExpExecArray | null;
        
        // Create a new regex object
        if (pattern.caseSensitive) {
            re = new RegExp(pattern.pattern, 'g');
        } else {
            re = new RegExp(pattern.pattern, 'gi');
        }

        // Loop through all the matches and add them to an array
        while (match = re.exec(text)) {
            tags.push({name: pattern.name, start: match.index, end: match.index+match[0].length});
        }
    }

    console.log("Found " + tags.length + " tag" + (tags.length === 1 ? "" : "s"));
    console.log(tags);

    return tags;
}
