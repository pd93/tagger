'use strict';

import * as vscode from 'vscode';
import * as log from '../log';

export interface DefaultPatternSettings {
    flags: string;
    style: vscode.DecorationRenderOptions;
}

export interface PatternSettings extends DefaultPatternSettings {
    name: string;
    pattern: string;
}

export interface StatusBarSettings {
    enabled: boolean;
    output: string;
}

export class Settings {

    constructor() {
        log.Info("Creating Settings...");
        this.load();
    }

    // Variables
    public updateOn!: string;
    public include!: string;
    public exclude!: string;
    public goToBehaviour!: string;
    public statusBar!: StatusBarSettings;
    public defaultPattern!: DefaultPatternSettings;
    public patterns!: PatternSettings[];

    // update prints a message and calls load
    public update() {
        log.Info("Updating Settings...");
        this.load();
    }

    // load fetches all the settings from the workspace configuration file
    private load() {
        
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("tagger");
    
        // Get the configs
        let updateOn: string | undefined = config.get("updateOn");
        let include: string | undefined = config.get("include");
        let exclude: string | undefined = config.get("exclude");
        let goToBehaviour: string | undefined = config.get("goToBehaviour");
        let statusBarEnabled: boolean | undefined = config.get("statusBar.enabled");
        let statusBarOutput: string | undefined = config.get("statusBar.output");
        let defaultPatternFlags: string | undefined = config.get("defaultPattern.flags");
        let defaultPatternStyle: vscode.DecorationRenderOptions | undefined = config.get("defaultPattern.style");
        let patternSettings: PatternSettings[] | undefined = config.get("patterns");

        // Set the configs
        this.updateOn = updateOn !== undefined ? updateOn : "change";
        this.include = include !== undefined ? include : "**/*";
        this.exclude = exclude !== undefined ? exclude : "**/{node_modules,vendor}/*";
        this.goToBehaviour = goToBehaviour !== undefined ? goToBehaviour : "end";
        this.statusBar = {
            enabled: statusBarEnabled !== undefined ? statusBarEnabled : true,
            output: statusBarOutput !== undefined ? statusBarOutput : "$(tag) {all}"
        };
        this.defaultPattern = {
            flags: defaultPatternFlags !== undefined ? defaultPatternFlags : "g",
            style: defaultPatternStyle !== undefined ? defaultPatternStyle : {
                color: "#FFFFFF",
                backgroundColor: "#CF3F61",
                overviewRulerColor: "#CF3F61"
            }
        };
        this.patterns = patternSettings !== undefined ? patternSettings : [];
    }
}