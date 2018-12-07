'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import * as fs from 'fs';

export class Tag {

    constructor(
        public readonly name: string,
        public readonly text: string,
        public readonly filepath: string,
        public readonly index: number,
        public readonly start: vscode.Position,
        public readonly end: vscode.Position
    ) {}

    // tooltip will return a tooltip string
    public tooltip(): string {
        let line = this.start.line === this.end.line ? this.start.line + 1 : (this.start.line + 1) + "-" + (this.end.line + 1);
        return `File: ${this.filepath} Line: ${line}`;
    }

    // go will open a tag in the editor
    public go(): void {
        
        log.Info(`Jumping to tag: '${this.tooltip()}'...`);

        let options: vscode.TextDocumentShowOptions = {
            selection: new vscode.Range(this.end, this.end)
        };

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
