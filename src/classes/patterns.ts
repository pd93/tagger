'use strict';

import * as vscode from 'vscode';
import * as log from '../log';
import { Pattern, IPatternSettings, IDefaultPatternSettings, SVG } from './';

export class Patterns extends Array<Pattern> {

    constructor(
        patternSettings?: IPatternSettings[],
        defaultPatternSettings?: IDefaultPatternSettings
    ) {
        super();

        // If settings provided, update the patterns
        if (patternSettings && defaultPatternSettings) {
            this.update(patternSettings, defaultPatternSettings);
        }
    }

    // update will update the patterns array
    public update(patternSettings: IPatternSettings[], defaultPatternSettings: IDefaultPatternSettings) {

        log.Info("Updating patterns...");

		// Init
		this.length = 0; // Clear the array

        // Fetch the patterns settings
        let mergedPatternSettingStyle: vscode.DecorationRenderOptions;
        let mergedPatternSettingFlags: string;
        
        // Reset tag SVGs
        SVG.reset();
        
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
            this.push(new Pattern(
                patternSetting.name,
                patternSetting.pattern,
                mergedPatternSettingFlags,
                mergedPatternSettingStyle
            ));
        }
    }
}