'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const template = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <path color="{{color}}" d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line color="{{color}}" x1="7" y1="7" x2="7" y2="7"></line>
</svg>`;

export class SVG {
    
    constructor(
        name: string,
        public color: string | vscode.ThemeColor | undefined
    ) {
        
        // Create a filename
        this.filename = path.join(__dirname, '..', '..', '..', 'res', 'tags', `${name}.svg`);
        
        // Set the SVG color
        let text = template.replace(/{{color}}/g, `${this.color}`);

        // Write a new file to the res/tags folder
        fs.writeFileSync(this.filename, text);
    }

    public filename: string;

    // reset will clear or create the tag SVGs directory
    public static reset(): void {

        // Create a path to the directory
        let directory: string = path.join(__dirname, '..', '..', '..', 'res', 'tags');

        // If directory exists
        if (fs.existsSync(directory)) {

            // Loop through files and delete them
            let files = fs.readdirSync(directory);
            for (let file of files) {
                fs.unlinkSync(path.join(directory, file));
            }
        }
        
        // Create the directory
        else {
            fs.mkdirSync(directory, 644);
        }
    }
}