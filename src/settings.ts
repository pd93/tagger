'use strict';

import * as vscode from 'vscode';
import { Pattern } from './interfaces';

export class Settings {

    constructor() {
        
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("tagger");
    
        // Assign the settings or their defaults
        this.updateOn = config.get("updateOn") || "change";
        this.include = config.get("include") || "**/*";
        this.exclude = config.get("exclude") || "";
        this.maxResults = config.get("maxResults") || 100;
        this.patterns = config.get("patterns") || [];
    }

    public updateOn: string;
    public include: string;
    public exclude: string;
    public maxResults: number;
    public patterns: Pattern[];
}