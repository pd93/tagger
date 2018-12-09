'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import * as fs from 'fs';

export class Tag {

    constructor(
        public readonly name: string,
        public readonly text: string,
        public readonly groups: string[],
        public readonly filepath: string,
        public readonly index: number,
        public readonly start: vscode.Position,
        public readonly end: vscode.Position
    ) {}

    // pretty will return the pretty tag text (concatenated from the capture groups)
    public pretty() {

        // If there are capture groups
        if (this.groups.length > 0) {

            // Join and return them
            return this.groups.join(" ").trim();
        }

        // Otherwise, return the full text
        return this.text.trim();
    }

    // tooltip will return a tooltip string
    public tooltip(): string {
        let line = this.start.line === this.end.line ? this.start.line + 1 : (this.start.line + 1) + "-" + (this.end.line + 1);
        return `File: ${this.filepath} Line: ${line}`;
    }

    // go will open a tag in the editor
    public go(goToBehaviour: string, preview: boolean = true): void {
        
        log.Info(`Jumping to tag: '${this.tooltip()}'...`);

        // Create a range depending on the go-to behaviour
        let range: vscode.Range | undefined;
        switch (goToBehaviour) {
            case "start":
                range = new vscode.Range(this.start, this.start);
                break;
            case "end":
                range = new vscode.Range(this.end, this.end);
                break;
            case "highlight":
                range = new vscode.Range(this.start, this.end);
                break;
        }

        // Create the text document show options
        let options: vscode.TextDocumentShowOptions = {
            selection: range,
            preview: preview
        };

        // Run the vscode open command with the range options
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(this.filepath), options);
    }

    // delete will delete the tag from the file
    public async delete(): Promise<void> {

        log.Info(`Deleting tag: '${this.tooltip()}'...`);

        // Open the document the tag is in
        let document = await vscode.workspace.openTextDocument(this.filepath);
        
        // Get the text and line of the document 
        let text: string = document.getText();
        
        // Remove the tag from the code
        text = text.substring(0, this.index) + text.substring(this.index + this.text.length);
        
        // Get the text as lines
        let lines: string[] = text.split('\n');

        // Remove the line if it is now empty
        if (lines[this.start.line].trim() === "") {
            lines.splice(this.start.line, 1);
        }

        // If it's not empty, decide how to format the remaining text
        else {

            let before: string = "";
            let after: string = "";

            // Get the before tag text
            if (lines[this.start.line].substring(0, this.start.character) !== "") {

                before = lines[this.start.line].substring(0, this.start.character);
            
                if (before.trim() !== "") {
                    before = before.trimRight();
                }
            }
            
            // Get the after tag text
            if (lines[this.start.line].substring(this.start.character) !== "") {

                after = lines[this.start.line].substring(this.start.character);

                if (after.trim() !== "") {
                    after = after.trimLeft();
                }
            }

            // If there is a before and after, put a space between them
            if (before.trim() !== "" && after.trim() !== "") {
                before += " ";
            } 

            // Set the line contents
            lines[this.start.line] = before + after;
        }

        // Rejoin the text
        text = lines.join('\n');

        // Write the file
        fs.writeFile(document.fileName, text, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}
