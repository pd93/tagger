'use strict';

import * as vscode from 'vscode';
import * as structures from './structures';

export function findTagsByPattern(pattern: structures.Pattern, document: vscode.TextDocument): structures.Tag[] {

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

// FindTags will scan the active text editor for matches to the configured tag patterns
export function findTags(patterns: structures.Pattern[], document: vscode.TextDocument): structures.Tag[] {

    console.log("Finding tags...");

    // Init
    let tags: structures.Tag[] = [];

    // Loop through each tag
    for (let pattern of patterns) {
        tags.push(...findTagsByPattern(pattern, document));
    }

    console.log(tags);

    return tags;
}
