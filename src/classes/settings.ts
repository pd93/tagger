'use strict';

import * as vscode from 'vscode';
import * as log from '../log';

export interface IDefaultPatternSettings {
    flags: string;
    style: vscode.DecorationRenderOptions;
}

export interface IPatternSettings extends IDefaultPatternSettings {
    name: string;
    pattern: string;
}

export interface IStatusBarSettings {
    enabled: boolean;
    output: string;
}

export interface IFiles {
    include: string;
    exclude: string;
    excludeConfigFiles: boolean;
    excludeGitIgnoredFiles: boolean;
}

export class Settings {

    constructor() {
        log.Info("Creating Settings...");
        this._load();
    }
    
    // Variables
    public updateOn!: string;
    public goToBehaviour!: string;
    public files!: IFiles;
    public statusBar!: IStatusBarSettings;
    public defaultPattern!: IDefaultPatternSettings;
    public patterns!: IPatternSettings[];

    // update prints a message and calls load
    public update() {
        log.Info("Updating Settings...");
        this._load();
    }

    // _load fetches all the settings from the workspace configuration file
    private _load() {
        
        // Get the workspace config
        let config = vscode.workspace.getConfiguration("tagger");
    
        // Get the configs
        let updateOn: string | undefined = config.get("updateOn");
        let goToBehaviour: string | undefined = config.get("goToBehaviour");
        let filesInclude: string | undefined = config.get("files.include");
        let filesExclude: string | undefined = config.get("files.exclude");
        let filesExcludeConfigFiles: boolean | undefined = config.get("files.excludeConfigFiles");
        let filesExcludeGitIgnoredFiles: boolean | undefined = config.get("files.excludeGitIgnoredFiles");
        let statusBarEnabled: boolean | undefined = config.get("statusBar.enabled");
        let statusBarOutput: string | undefined = config.get("statusBar.output");
        let defaultPatternFlags: string | undefined = config.get("defaultPattern.flags");
        let defaultPatternStyle: vscode.DecorationRenderOptions | undefined = config.get("defaultPattern.style");
        let patterns: IPatternSettings[] | undefined = config.get("patterns");

        // Set the configs
        this.updateOn = updateOn !== undefined ? updateOn : "change";
        this.goToBehaviour = goToBehaviour !== undefined ? goToBehaviour : "end";
        this.files = {
            include: filesInclude !== undefined ? filesInclude : "**/*",
            exclude: filesExclude !== undefined ? filesExclude : "**/{node_modules,vendor}/**",
            excludeConfigFiles: filesExcludeConfigFiles !== undefined ? filesExcludeConfigFiles : true,
            excludeGitIgnoredFiles: filesExcludeGitIgnoredFiles !== undefined ? filesExcludeGitIgnoredFiles : true,
        };
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
        this.patterns = patterns !== undefined ? patterns : [];
    }
}