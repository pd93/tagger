'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as log from '../log';
import * as utils from '../utils';
import { Tag, Tags, Pattern, Patterns, ActivityBar, TreeItem, Decorator, StatusBar, Settings } from './';

export class Tagger {

    constructor() {

        log.Info("Creating an instance of Tagger...");

        // Init variables
        this._settings = new Settings();
        this._patterns = new Patterns(this._settings.patterns, this._settings.defaultPattern);
        this._tags = new Tags();

        // Init UI elements
        this._activityBar = new ActivityBar(this._patterns);
        this._statusBar = new StatusBar();
        this._decorator = new Decorator(this._patterns);

        // Init filesystem watcher
        this._watcher = vscode.workspace.createFileSystemWatcher("**/*");
    }

    // Variables
    private _settings: Settings;
    private _patterns: Patterns;
    private _tags: Tags;
    private _activityBar: ActivityBar;
    private _statusBar: StatusBar;
    private _decorator: Decorator;
    private _watcher: vscode.FileSystemWatcher;

    //
    // Getters
    //

    get tags(): Tags {
        return this._tags;
    }

    get patterns(): Patterns {
        return this._patterns;
    }

    get settings(): Settings {
        return this._settings;
    }

    //
    // Updater
    //

    // Update all the tag views
    public async update(): Promise<void> {
        try {
            await this._tags.update(this._patterns, this._settings.include, this._settings.exclude);
        } catch (err) {
            log.Error(err);
        }
    }

    //
    // Registrars
    //

    // registerListeners will register the listen events with the tagger instance and vscode
    public registerListeners(context: vscode.ExtensionContext): void {

        // If manual updating is turned off (update on save)
        if (this._settings.updateOn !== "manual") {
            
            // When a file on the system is changed
            this._watcher.onDidChange(async uri => {await this._onDidChange(uri);});
            
            // When a file on the system is created
            this._watcher.onDidCreate(async uri => {await this._onDidCreate(uri);});
            
            // When a file or directory on the system is deleted
            this._watcher.onDidDelete(uri => {this._onDidDelete(uri);});
    
            // Listen for when the active editor changes
            vscode.window.onDidChangeVisibleTextEditors(editors => {this._onDidChangeVisibleTextEditors(editors);}, null, context.subscriptions);

            // If it should update when files change in vscode too
            if (this._settings.updateOn === "change") {
                vscode.workspace.onDidChangeTextDocument(event => {this._onDidChangeTextDocument(event);}, null, context.subscriptions);
            }
        }
    
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(async event => {await this._onDidChangeConfiguration(event);});
    }

    public registerCommands(context: vscode.ExtensionContext): void {

        // Refresh activity bar
        context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshActivityBar', () => {
            this.refreshActivityBar();
        }));

        // Refresh status bar
        context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshStatusBar', () => {
            this.refreshStatusBar();
        }));
        
        // Refresh decorations
        context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshDecorations', () => {
            this.refreshDecorations();
        }));
        
        // Refresh everything
        context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', () => {
            this.update().then(() => {
                this.refresh();
            });
        }));
        
        // Navigate to a tag
        context.subscriptions.push(vscode.commands.registerCommand('tagger.goToTag', (treeItem?: TreeItem, tag?: Tag) => {
            if (treeItem && treeItem.tag) {
                this.goToTag(treeItem.tag, false);
            } else if (tag) {
                this.goToTag(tag);
            } else {
                this.goToTag(undefined);
            }
        }));
        
        // Delete a tag
        context.subscriptions.push(vscode.commands.registerCommand('tagger.deleteTag', (treeItem?: TreeItem) => {
            this.deleteTag(treeItem ? treeItem.tag : undefined);
        }));
    }

    //
    // Listeners
    //

    // onDidChangeTextDocument listens for changes to documents in the workspace
    private _onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {

        // Check if we should search the file
        if (utils.shouldSearchDocument(event.document, this._settings.include, this._settings.exclude)) {

            log.Event("doc change", event.document.uri.fsPath);
            
            // Update tags for the file that changed
            this._tags.updateForDocument(this._patterns, event.document);
            
            // Refresh the activity and status bars
            this.refreshActivityBar();
            this.refreshStatusBar();
            
            // If the file that changed is currently open, update the decorations too
            if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                this.refreshDecorations();
            }
            
        } else {
            log.Event("doc change", `[skipped] ${event.document.uri.fsPath}`);
        }
    }

    // onDidChange listens for changes to files in the workspace
    private async _onDidChange(uri: vscode.Uri) {

        try {

            // If it's a file
            if (fs.lstatSync(uri.fsPath).isFile()) {

                // If the file is not open
                if (!utils.isFileOpen(uri)) {
                                
                    // Check if we should search the file
                    if (utils.shouldSearchFile(uri, this._settings.include, this._settings.exclude)) {
                        
                        log.Event("fs change", uri.fsPath);

                        // Update tags for the file that changed
                        if (await this._tags.updateForFile(this._patterns, uri) >= 0) {
            
                            this.refreshActivityBar();
                            this.refreshStatusBar();

                        } else {
                            log.Error(new Error(`- failed to update tags for file: ${uri.fsPath}`));
                        }

                    } else {
                        log.Event("fs change", `[skipped file] ${uri.fsPath}`);
                    }
                
                } else {
                    log.Event("fs change", `[already open] ${uri.fsPath}`);
                }
                
            } else {
                log.Event("fs change", `[skipped directory] ${uri.fsPath}`);
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidCreate listens for new files in the workspace
    private async _onDidCreate(uri: vscode.Uri) {

        try {

            // If it's a file
            if (fs.lstatSync(uri.fsPath).isFile()) {

                // If the file is not open
                if (!utils.isFileOpen(uri)) {

                    // Check if we should search the file
                    if (utils.shouldSearchFile(uri, this._settings.include, this._settings.exclude)) {
                        
                        log.Event("fs create", uri.fsPath);
                        
                        // Update tags for the file that changed
                        if (await this._tags.updateForFile(this._patterns, uri) >= 0) {

                            this.refreshActivityBar();
                            this.refreshStatusBar();

                        } else {
                            log.Error(new Error(`- failed to update tags for file: ${uri.fsPath}`));
                        }

                    } else {
                        log.Event("fs create", `[skipped file] ${uri.fsPath}`);
                    }
                    
                } else {
                    log.Event("fs create", `[already open] ${uri.fsPath}`);
                }
                    
            } else {

                log.Event("fs create", `[directory] ${uri.fsPath}`);

                // Check for files in created folder (for renames)
                if (await this._tags.update(this._patterns, utils.dirAsGlob(uri), this._settings.exclude) > 0) {

                    // Update the UI
                    this.refreshActivityBar();
                    this.refreshStatusBar();

                    // Files in the dir may be open, so refresh decorations too
                    this.refreshDecorations();
                }
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidCreate listens for deleted files in the workspace
    private _onDidDelete(uri: vscode.Uri) {
            
        try {

            // Check if we should search the file or directory
            if (utils.shouldSearchFile(uri, this._settings.include, this._settings.exclude)) {
                
                log.Event("fs delete", uri.fsPath);

                // Check if we can find changes to tags in the file or directory
                if (this._tags.removeForFile(uri) > 0 || this._tags.removeForDirectory(uri) > 0) {

                    this.refreshActivityBar();
                    this.refreshStatusBar();

                } else {
                    log.Info(`File or directory no longer exists or contained no tags: ${uri.fsPath}`);
                }

            } else {
                log.Event("fs delete", `[skipped] ${uri.fsPath}`);   
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidChangeVisibleTextEditors listens for changes in open editors
    private _onDidChangeVisibleTextEditors(editors: vscode.TextEditor[]) {
        
        // If the editor is active, refresh the decorations
        if (editors) {
            this.refreshDecorations(editors);
        }
    }

    // onDidChangeConfiguration listens for changes to configuration files
    private async _onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {

        try {
            
            // If a change was made to the tagger config
            if (event.affectsConfiguration("tagger")) {

                // Update the settings
                this._settings.update();
                
                // Update the patterns
                this._patterns.update(this._settings.patterns, this._settings.defaultPattern);
                    
                // Send the new patterns to the decorator and tree view
                this._decorator.setPatterns(this._patterns);
                this._activityBar.setPatterns(this._patterns);

                // Update the tags
                await this.update();

                // Refresh the views
                this.refresh();
            }
            
        } catch (err) {
            log.Error(err);
        }
    }
    
    //
    // Commands
    //
    
    // refresh will perform a full update of all tags and refresh the tree view and decorations
    public refresh(): void {
        this.refreshActivityBar();
        this.refreshStatusBar();
        this.refreshDecorations();
    }

    // refreshActivityBar will populate the tree view using the latest tags
    public refreshActivityBar() {
        this._activityBar.refresh(this._tags.getMap(this._patterns));
    }
    
    // refreshStatusBar will update the tag count in the status bar
    public refreshStatusBar(): void {
        this._statusBar.refresh(this._settings.statusBar, this._tags.length, this._tags.getMap(this._patterns));
    }

    // refreshDecorations will decorate the active text editor using the latest tags
    public refreshDecorations(editors?: vscode.TextEditor[]): void {
        
        // Init
        if (!editors) {
            editors = vscode.window.visibleTextEditors;
        }
        
        // Loop through the editors and refresh them
        for (let editor of editors) {
            if (utils.shouldSearchDocument(editor.document, this._settings.include, this._settings.exclude)) {
                this._decorator.refresh(editor, this._tags.getMap(this._patterns, editor.document));
            }
        }
    }

    // goToTag will navigate to the provided tag or show a quick pick to select a tag to navigate to
    public goToTag(tag?: Tag, preview: boolean = true): void {

        // Tag parsed in
        if (tag) {
            tag.go(this._settings.goToBehaviour, preview);
        }

        // Display a list of tags to navigate to
        else {   

            try {

                // Get patterns as quick pick items
                let quickPickItemPattern: vscode.QuickPickItem[] = [];
                for (let [index, pattern] of this._patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this._patterns[id];
                        let tags: Tags = this._tags.get(pattern);
                        
                        // Get tags for pattern as quick pick items
                        let quickPickItemTag: vscode.QuickPickItem[] = [];
                        for (let [index, tag] of tags.entries()) {
                            quickPickItemTag.push({
                                label: `${index + 1}: ${tag.pretty()}`,
                                description: tag.tooltip()
                            });
                        }
                
                        // Show the quick pick menu
                        vscode.window.showQuickPick(quickPickItemTag).then(selection => {
                            if (selection) {
                                let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                                tags[id].go(this._settings.goToBehaviour, preview);
                            }
                        });                        
                    }
                });

            } catch (err) {
                log.Error(err);
            }
        }
    }
    
    // deleteTag will remove the provided tag from the code or show a quick pick to select a tag to delete
    public async deleteTag(tag?: Tag): Promise<void> {

        // Tag parsed in 
        if (tag) {        
            try {
                await tag.delete();
            } catch (err) {
                log.Error(err);
            }
        }

        // Display a list of tags to delete
        else {

            try {
                
                // Get patterns as quick pick items
                let quickPickItemPattern: vscode.QuickPickItem[] = [];
                for (let [index, pattern] of this._patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this._patterns[id];
                        let tags: Tags = this._tags.get(pattern);
                        
                        // Get tags for pattern as quick pick items
                        let quickPickItemTag: vscode.QuickPickItem[] = [];
                        for (let [index, tag] of tags.entries()) {
                            quickPickItemTag.push({
                                label: `${index + 1}: ${tag.pretty()}`,
                                description: tag.tooltip()
                            });
                        }
                
                        // Show the quick pick menu
                        vscode.window.showQuickPick(quickPickItemTag).then(selection => {
                            if (selection) {
                                let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                                tags[id].delete();
                            }
                        });                        
                    }
                });

            } catch (err) {
                log.Error(err);
            }
        }
    }
}