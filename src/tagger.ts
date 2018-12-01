'use strict';

import * as vscode from 'vscode';
import * as log from './log';
import { Tag, Pattern } from './interfaces';
import { Settings } from './settings';

export class Tagger {

    constructor() {

        log.Debug("Creating instance of Tagger");

        this.settings = new Settings();
        this.setDecorationTypes();
    }

    // Variables
    public settings: Settings;
    public tags: Tag[] = [];
    private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

    // updateTags will update the entire list of tags from scratch
    public async updateTags() {

        log.Debug("Updating tags...");

		// Init
		this.tags = [];
		let skipped: number = 0;

		// Get a list of files in the workspace
		let files = await vscode.workspace.findFiles(this.settings.include, this.settings.exclude);

		log.Info(`Found ${files.length} file${files.length === 1 ? "" : "s"} in the workspace`);

		// Loop through the files
		for (let file of files) {

            // Update the tags
            let fileUpdated = await this.updateTagsForFile(file);

            // If the file was skipped, increment the counter
            if (!fileUpdated) {
                skipped++;
            }
		}

		log.Info(`Found ${this.tags.length} tag${this.tags.length === 1 ? "" : "s"} in ${files.length-skipped} files (skipped ${skipped} files)`);
    }

    // updateTagsForFile will remove and re-add the tags for a given file
    public async updateTagsForFile(file: vscode.Uri): Promise<boolean> {

        // Init
		let document: vscode.TextDocument;

        try {

            // Get the file as a TextDocument
            document = await vscode.workspace.openTextDocument(file.fsPath);

            // Update the tags for the document
            this.updateTagsForDocument(document);

        } catch (err) {

            // If there's a problem reading the file, skip it and return false
            log.Info(`- Skipping file: '${file.fsPath}'...`);

            return false;
        }

        return true;
    }

    // updateTagsForDocument will remove and re-add the tags for given document
    public updateTagsForDocument(document: vscode.TextDocument): void {
        
        log.Info(`- Updating tags for file: '${document.fileName}'...`);

        // Remove the existing tags
        let added = this.removeTagsForDocument(document);
    
        // Add the new tags
        let removed = this.addTagsForDocument(document);

        log.Debug(`Added: ${added} - Removed: ${removed} - Total: ${added-removed}`);
    }

    // getTagsForDocument will return an array of tags found in a given document
    public getTagsForDocument(document: vscode.TextDocument): Tag[] {

        // Init
        let tags: Tag[] = [];

        // Loop through the instance tags
        for (let tag of this.tags) {

            // If the pattern name matches, add the tag to the array
            if (tag.filepath === document.fileName) {
                tags.push(tag);
            }
        }

        return tags;
    }

    // getTagsForPattern will return an array of tags found in a given pattern
    public getTagsForPattern(pattern: Pattern): Tag[] {

        // Init
        let tags: Tag[] = [];

        // Loop through the instance tags
        for (let tag of this.tags) {

            // If the pattern name matches, add the tag to the array
            if (tag.name === pattern.name) {
                tags.push(tag);
            }
        }

        return tags;
    }

    // removeTagsForDocument will remove all the tags for a given document
    private removeTagsForDocument(document: vscode.TextDocument): number {

        // Init
        let tags: Tag[] = [];
        let count: number = 0;

        // Loop through the instance tags
        for (let tag of this.tags) {

            // If the filepath doesn't match, add the tag to the array
            if (tag.filepath === document.fileName) {
                count++;
            } else {
                tags.push(tag);
            }
        }
        
        // Update the instance tags
        this.tags = tags;

        return count;
    }

    // addTagsForDocument will add all the tags for a given document
    private addTagsForDocument(document: vscode.TextDocument): number {

        // Init
        let count: number = 0;
        let match: RegExpExecArray | null;
        let re;
        
        // Loop through the patterns
        for (let pattern of this.settings.patterns) {
            
            // Create a new regex object
            if (pattern.caseSensitive) {
                re = new RegExp(pattern.pattern, 'g');
            } else {
                re = new RegExp(pattern.pattern, 'gi');
            }

            // Loop through all the matches and add them to an array
            while (match = re.exec(document.getText())) {
                this.tags.push({
                    name: pattern.name,
                    text: match[0],
                    filepath: document.uri.fsPath,
                    start: document.positionAt(match.index),
                    end: document.positionAt(match.index + match[0].length)
                });

                count++;
            }
        }

        return count;
    }

    //
    // Decorations
    //

    // setDecorationTypes will create a decoration for each pattern
    public setDecorationTypes(): void {

        log.Debug("Creating decoration types...");

        // Init
        this.decorationTypes = new Map();
    
        // Loop through the patterns and add the styles
        for (let pattern of this.settings.patterns) {
            this.decorationTypes.set(pattern.name, vscode.window.createTextEditorDecorationType(pattern.style));
        }
    }

    // decorate will decorate the active text editor by highlighting tags
    public decorate(): void {
        
        log.Debug("Decorating editor...");

        // Init
        let editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return;
        }

        // Get the tags for the current document
        let tags = this.getTagsForDocument(editor.document);
        
        // Loop through the patterns
        for (let pattern of this.settings.patterns) {

            // Init
            let ranges: vscode.Range[] = [];

            // Loop through the tags
            for (let tag of tags) {
                ranges.push(new vscode.Range(tag.start, tag.end));
            }

            // Get the decoration type
            let decorationType = this.decorationTypes.get(pattern.name);
            if (!decorationType) {
                throw new Error(`No decoration type found for pattern: '${pattern.name}'`);
            }

            // Set the decorations
            editor.setDecorations(decorationType, ranges);

            // TODO: Set the scroll bar markers
        }
    }
}