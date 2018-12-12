'use strict';

import * as vscode from 'vscode';
import chalk from 'chalk';
import * as log from '../utils/log';
import { Pattern, Tag } from './';

export class Tags extends Array<Tag> { 
    
    //
    // Sort
    //

    // sortTags will sort the tag array alphabetically
    public sortTags() {
        this.sort((a: Tag, b: Tag) => {
            let pa = a.pretty();
            let pb = b.pretty();
            return pa > pb ? 1 : (pa < pb ? -1 : 0);
        });
    }

    //
    // Update
    //

    // update will update the entire list of tags from scratch
    public async update(patterns: Pattern[], include: string, exclude: string) {

        log.Info("Updating tags...");

		// Init
		this.length = 0; // Clear the array
		let skipped: number = 0;

		// Get a list of files in the workspace
		let uris = await vscode.workspace.findFiles(include, exclude);

		log.Info(`Found ${uris.length} file${uris.length === 1 ? "" : "s"} in the workspace`);

		// Loop through the files
		for (let uri of uris) {

            // Update the tags
            let count = await this.updateForFile(patterns, uri, false);

            // If the file was skipped, increment the counter
            if (count < 0) {
                skipped++;
            }
        }

		log.Info(`Found ${this.length} tag${this.length === 1 ? "" : "s"} in ${uris.length-skipped} files (skipped ${skipped} files)`);
        
        // Sort the tags
        this.sortTags();
    }

    // updateForFile will remove and re-add the tags for a given file
    public async updateForFile(patterns: Pattern[], uri: vscode.Uri, sort: boolean = true): Promise<number> {
        try {
            let document: vscode.TextDocument = await this.getDocument(uri);
            return this.updateForDocument(patterns, document, sort);
        } catch (err) {
            return -1;
        }
    }

    // addForFile will add the tags for a given file
    public async addForFile(patterns: Pattern[], uri: vscode.Uri): Promise<number> {
        try {
            let document: vscode.TextDocument = await vscode.workspace.openTextDocument(uri.fsPath);
            let count: number = this.addForDocument(patterns, document);
            log.Info(`${chalk.green(`+${count}`)} ${chalk.red("-0")}: ${uri.fsPath}`);
            return count;
        } catch (err) {
            return -1;
        }
    }

    // removeForFile will remove the tags for a given file
    public removeForFile(uri: vscode.Uri, sort: boolean = true): number {
        
        // Init
        let count: number = 0;
        
        // Loop through the instance tags
        for (let index = 0; index < this.length; index++) {
            
            // If the filepaths match
            if (this[index].filepath === uri.fsPath) {
                
                // Remove the tag from the array
                this.splice(index, 1);
                
                index--;
                count++;
            }
        }
        
        // Sort the tags
        if (sort) {
            this.sortTags();
        }
        
        log.Info(`${chalk.green("+0")} ${chalk.red(`-${count}`)}: ${uri.fsPath}`);

        return count;
    }

    // updateForDocument will remove and re-add the tags for given document
    public updateForDocument(patterns: Pattern[], document: vscode.TextDocument, sort: boolean = true): number {

        // Remove the existing tags
        let removed = this.removeForDocument(document, false);
    
        // Add the new tags
        let added = this.addForDocument(patterns, document, false);
        
        // Sort the tags
        if (sort) {
            this.sortTags();
        }
        
        log.Info(`${chalk.green(`+${added}`)} ${chalk.red(`-${removed}`)}: ${document.uri.fsPath}`);

        return added + removed;
    }

    // addForDocument will add all the tags for a given document
    private addForDocument(patterns: Pattern[], document: vscode.TextDocument, sort: boolean = true): number {

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
                    match.slice(1, match.length),
                    document.uri.fsPath,
                    match.index,
                    document.positionAt(match.index),
                    document.positionAt(match.index + match[0].length)
                ));

                count++;
            }
        }
        
        // Sort the tags
        if (sort) {
            this.sortTags();
        }
        
        return count;
    }
    
    // removeForDocument will remove all the tags for a given document
    private removeForDocument(document: vscode.TextDocument, sort: boolean = true): number {
        
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
        
        // Sort the tags
        if (sort) {
            this.sortTags();
        }

        return count;
    }
    
    //
    // Getters
    //

    // getTags will return an array of tags found for a given pattern and/or document
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

    // getTagsAsMap will return a map of patterns to tags found globally or for a given document
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

    // 
    private async getDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {

        try {

            // Get the file as a TextDocument
            return await vscode.workspace.openTextDocument(uri.fsPath);

        } catch (err) {

            // If there's a problem reading the file, skip it and return false
            log.Info(`[Skipping] file: '${uri.fsPath}'...`);

            return Promise.reject(err);
        }
    }
}