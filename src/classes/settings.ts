'use strict';

import * as vscode from 'vscode';
import { Pattern } from '../classes/pattern';

export class Settings {

    constructor() {
        
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("tagger");
    
        // Assign the settings or their defaults
        this.updateOn = config.get("updateOn") || "change";
        this.include = config.get("include") || "**/*";
        this.exclude = config.get("exclude") || "";
        this.patterns = [];

        // Fetch the patterns a instances of Pattern
        let patterns: Pattern[] = config.get("patterns") || [];
        for (let pattern of patterns) {
            this.patterns.push(new Pattern(pattern.name, pattern.pattern, pattern.caseSensitive, pattern.style));
        }
    }

    public updateOn: string;
    public include: string;
    public exclude: string;
    public patterns: Pattern[];
}