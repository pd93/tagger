'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern } from './';

interface DefaultPatternSettings {
    flags: string;
    style: vscode.DecorationRenderOptions;
}

interface PatternSettings extends DefaultPatternSettings {
    name: string;
    pattern: string;
}

export class Settings {

    constructor() {
        log.Info("Creating Settings...");
        this.load();
    }

    // Variables
    public updateOn: string = "";
    public include: string = "";
    public exclude: string = "";
    public patterns: Pattern[] = [];

    // update prints a message and calls load
    public update() {
        log.Info("Updating Settings...");
        this.load();
    }

    // load fetches all the settings from the workspace configuration file
    private load() {
        
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("tagger");
    
        // Assign the settings or their defaults
        this.updateOn = config.get("updateOn") || "change";
        this.include = config.get("include") || "**/*";
        this.exclude = config.get("exclude") || "**/node_modules/*";
        this.patterns = [];

        // Get default pattern settings
        let defaultPatternSettings: DefaultPatternSettings = {
            flags: config.get("defaultPattern.flags") || 'g',
            style: config.get("defaultPattern.style") || {}
        };

        // Fetch the patterns a instances of Pattern
        let patternSettings: PatternSettings[] = config.get("patterns") || [];
        let mergedPatternSettingStyle: vscode.DecorationRenderOptions;
        let mergedPatternSettingFlags: string;
        
        // Loop through the pattern settings
        for (let patternSetting of patternSettings) {

            // Validate the name
            if (!patternSetting.name) {
                vscode.window.showErrorMessage("Missing property: 'name' in pattern object");
                return;
            }

            // Validate the pattern
            if (!patternSetting.pattern) {
                vscode.window.showErrorMessage("Missing property: 'pattern' in pattern object");
                return;
            }

            // Merge the pattern settings with the defaults
            mergedPatternSettingFlags = patternSetting.flags ? patternSetting.flags : defaultPatternSettings.flags;
            mergedPatternSettingStyle = {...defaultPatternSettings.style, ...patternSetting.style};
    
            // Create a new pattern object from each setting
            this.patterns.push(new Pattern(
                patternSetting.name,
                patternSetting.pattern,
                mergedPatternSettingFlags,
                mergedPatternSettingStyle
            ));
        }
    }
}