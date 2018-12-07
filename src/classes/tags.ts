'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern, Tag } from './';

export class Tags extends Array<Tag> { 
    
    //
    // Sort
    //

    // sortTags will sort the tag array alphabetically
    public sortTags() {
        this.sort((a: Tag, b: Tag) => {
            return a.text > b.text ? 1 : (a.text < b.text ? -1 : 0);
        });
    }

    //
    // Update
    //

    // update will update the entire list of tags from scratch
    public async update(patterns: Pattern[], include: string, exclude: string) {

        log.Debug("Updating tags...");

		// Init
		this.length = 0; // Clear the array
		let skipped: number = 0;

		// Get a list of files in the workspace
		let files = await vscode.workspace.findFiles(include, exclude);

		log.Info(`Found ${files.length} file${files.length === 1 ? "" : "s"} in the workspace`);

		// Loop through the files
		for (let file of files) {

            // Update the tags
            let fileUpdated = await this.updateForFile(patterns, file, false);

            // If the file was skipped, increment the counter
            if (!fileUpdated) {
                skipped++;
            }
        }

		log.Info(`Found ${this.length} tag${this.length === 1 ? "" : "s"} in ${files.length-skipped} files (skipped ${skipped} files)`);
        
        // Sort the tags
        this.sortTags();
    }

    // updateForFile will remove and re-add the tags for a given file
    public async updateForFile(patterns: Pattern[], file: vscode.Uri, sort: boolean = true): Promise<boolean> {

        // Init
		let document: vscode.TextDocument;

        try {

            // Get the file as a TextDocument
            document = await vscode.workspace.openTextDocument(file.fsPath);

            // Update the tags for the document
            this.updateForDocument(patterns, document, sort);

        } catch (err) {

            // If there's a problem reading the file, skip it and return false
            log.Info(`[Skipping] file: '${file.fsPath}'...`);

            return false;
        }

        return true;
    }

    // updateForDocument will remove and re-add the tags for given document
    public updateForDocument(patterns: Pattern[], document: vscode.TextDocument, sort: boolean = true): void {

        // Remove the existing tags
        let removed = this.removeTagsForDocument(document);
    
        // Add the new tags
        let added = this.addTagsForDocument(patterns, document);
        
        log.Info(`[+${added} -${removed} = ${added-removed}] file: '${document.fileName}'`);
        
        // Sort the tags
        if (sort) {
            this.sortTags();
        }
    }

    //
    // Getters
    //

    // getTags will return an array of tags found for a given pattern and document
    public getTags(pattern: Pattern, document?: vscode.TextDocument): Tags {

        // Init
        let tags: Tags = new Tags();

        // Loop through the instance tags
        for (let tag of this) {

            // If there is a document
            if (document) {

                // If the pattern name and the document match the tag, add it to the array
                if (tag.name === pattern.name && tag.filepath === document.fileName) {
                    tags.push(tag);
                }
            }
            
            // If there is no document, but the pattern name matches the tag, add it to the array
            else if (tag.name === pattern.name) {
                tags.push(tag);
            }
        }

        return tags;
    }

    public getTagsAsMap(patterns: Pattern[], document?: vscode.TextDocument): Map<string, Tags> {
        
        // Init
        let tagMap: Map<string, Tags> = new Map();

        // Loop through the patterns and populate the map
        for (let pattern of patterns) {
            tagMap.set(pattern.name, this.getTags(pattern, document));
        }

        return tagMap;
    }

    //
    // Helpers
    //

    // removeTagsForDocument will remove all the tags for a given document
    private removeTagsForDocument(document: vscode.TextDocument): number {

        // Init
        let count: number = 0;

        // Loop through the instance tags
        for (let index = 0; index < this.length; index++) {

            // If the filepaths match
            if (this[index].filepath === document.fileName) {

                // Remove the tag from the array
                this.splice(index, 1);

                index--;
                count++;
            }
        }

        return count;
    }

    // addTagsForDocument will add all the tags for a given document
    private addTagsForDocument(patterns: Pattern[], document: vscode.TextDocument): number {

        // Init
        let count: number = 0;
        let match: RegExpExecArray | null;
        
        // Loop through the patterns
        for (let pattern of patterns) {

            // Loop through all the matches
            while (match = pattern.regexp.exec(document.getText())) {

                // Add the tag to the array
                this.push(new Tag(
                    pattern.name,
                    match[0],
                    document.uri.fsPath,
                    match.index,
                    document.positionAt(match.index),
                    document.positionAt(match.index + match[0].length)
                ));

                count++;
            }
        }

        return count;
    }
}