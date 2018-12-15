'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as log from '../log';
import * as utils from '../utils';
import { Tag, Tags, Pattern, Patterns, ActivityBar, TreeItem, Decorator, StatusBar, Settings } from './';

export class Tagger {

    constructor(
        private context: vscode.ExtensionContext
    ) {

        log.Info("Creating an instance of Tagger...");

        // Get the tagger settings
        this.settings = new Settings();
        this.patterns = new Patterns();
        this.tags = new Tags();

        // Register a tree view
        this.registerActivityBar();

        // Register a status bar item
        this.registerStatusBar();

        // Register a decorator
        this.registerDecorator();

        // Register listeners
        this.registerListeners();

        // Register commands
        this.registerCommands();

        // Refresh everything
        this.update().then(() => {
            this.refresh();
        });
    }

    // Variables
    private settings: Settings;
    private tags: Tags;
    private patterns: Patterns;
    private activityBar!: ActivityBar;
    private statusBar!: StatusBar;
    private decorator!: Decorator;
    private watcher!: vscode.FileSystemWatcher;

    //
    // Registrars
    //

    // registerActivityBar will register the tree view the tagger instance and vscode
    public registerActivityBar(): void {
        this.activityBar = new ActivityBar(this.patterns);
    }

    // registerStatusBar will register the status bar item with the tagger instance and vscode
    public registerStatusBar(): void {
        this.statusBar = new StatusBar();
    }

    // registerDecorator will register the decorator with the tagger instance
    public registerDecorator(): void {
        this.decorator = new Decorator(this.patterns);
    }

    // registerListeners will register the listen events with the tagger instance and vscode
    public registerListeners(): void {

        // Create a filesystem watcher
        this.watcher = vscode.workspace.createFileSystemWatcher("**/*");

        // If manual updating is turned off (update on save)
        if (this.settings.updateOn !== "manual") {
            
            // When a file on the system is changed
            this.watcher.onDidChange(uri => {this.onDidChange(uri);});
            
            // When a file on the system is created
            this.watcher.onDidCreate(uri => {this.onDidCreate(uri);});
            
            // When a file or directory on the system is deleted
            this.watcher.onDidDelete(uri => {this.onDidDelete(uri);});
    
            // Listen for when the active editor changes
            vscode.window.onDidChangeVisibleTextEditors(editors => {this.onDidChangeVisibleTextEditors(editors);}, null, this.context.subscriptions);

            // If it should update when files change in vscode too
            if (this.settings.updateOn === "change") {
                vscode.workspace.onDidChangeTextDocument(event => {this.onDidChangeTextDocument(event);}, null, this.context.subscriptions);
            }
        }
    
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {this.onDidChangeConfiguration(event);});
    }

    public registerCommands(): void {

        // Refresh activity bar
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshActivityBar', () => {
            this.refreshActivityBar();
        }));

        // Refresh status bar
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshStatusBar', () => {
            this.refreshStatusBar();
        }));
        
        // Refresh decorations
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshDecorations', () => {
            this.refreshDecorations();
        }));
        
        // Refresh everything
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', () => {
            this.update().then(() => {
                this.refresh();
            });
        }));
        
        // Navigate to a tag
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.goToTag', (treeItem?: TreeItem, tag?: Tag) => {
            if (treeItem && treeItem.tag) {
                this.goToTag(treeItem.tag, false);
            } else if (tag) {
                this.goToTag(tag);
            } else {
                this.goToTag(undefined);
            }
        }));
        
        // Delete a tag
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.deleteTag', (treeItem?: TreeItem) => {
            this.deleteTag(treeItem ? treeItem.tag : undefined);
        }));
    }

    //
    // Listeners
    //

    // onDidChangeTextDocument listens for changes to documents in the workspace
    private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {

        // Check if we should search the file
        if (utils.shouldSearchDocument(event.document, this.settings.include, this.settings.exclude)) {

            log.Event("doc change", event.document.uri.fsPath);
            
            // Update tags for the file that changed
            this.tags.updateForDocument(this.patterns, event.document);
            
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
    private async onDidChange(uri: vscode.Uri) {

        try {

            // If it's a file
            if (fs.lstatSync(uri.fsPath).isFile()) {

                // If the file is not open
                if (!utils.isFileOpen(uri)) {
                                
                    // Check if we should search the file
                    if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                        
                        log.Event("fs change", uri.fsPath);

                        // Update tags for the file that changed
                        if (await this.tags.updateForFile(this.patterns, uri) >= 0) {
            
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
                log.Event("fs change", `[skipped dir] ${uri.fsPath}`);
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidCreate listens for new files in the workspace
    private async onDidCreate(uri: vscode.Uri) {

        try {

            // If it's a file
            if (fs.lstatSync(uri.fsPath).isFile()) {

                // If the file is not open
                if (!utils.isFileOpen(uri)) {

                    // Check if we should search the file
                    if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                        
                        log.Event("fs create", uri.fsPath);
                        
                        // Update tags for the file that changed
                        if (await this.tags.updateForFile(this.patterns, uri) >= 0) {

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

                log.Event("fs create dir", `${uri.fsPath}`);

                // Check for files in created folder (for renames)
                await this.tags.update(this.patterns, this.settings.include, this.settings.exclude, utils.dirAsGlob(uri));

                // Update the UI
                this.refreshActivityBar();
                this.refreshStatusBar();

                // Files in the dir may be open, so refresh decorations too
                this.refreshDecorations();
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidCreate listens for deleted files in the workspace
    private async onDidDelete(uri: vscode.Uri) {
            
        try {

            // Check if we should search the file or directory
            if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                
                log.Event("fs delete", uri.fsPath);

                // If it's a file that changed
                if (this.tags.removeForFile(uri) > 0) {

                    this.refreshActivityBar();
                    this.refreshStatusBar();

                // If no tags were found, it could be a directory
                } else if (this.tags.removeForDirectory(uri) > 0) {

                    this.refreshActivityBar();
                    this.refreshStatusBar();

                } else {
                    log.Error(new Error(`- failed to update tags for file or directory: ${uri.fsPath}`));
                }

            } else {
                log.Event("fs delete", `[skipped] ${uri.fsPath}`);   
            }

        } catch (err) {
            log.Error(err);
        }
    }

    // onDidChangeVisibleTextEditors listens for changes in open editors
    private onDidChangeVisibleTextEditors(editors: vscode.TextEditor[]) {
        
        // If the editor is active, refresh the decorations
        if (editors) {
            this.refreshDecorations(editors);
        }
    }

    // onDidChangeConfiguration listens for changes to configuration files
    private async onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {

        try {
            
            // If a change was made to the tagger config
            if (event.affectsConfiguration("tagger")) {

                // Update the settings
                this.settings.update();

                // Update patterns and tags
                await this.update();
                    
                // Send the new patterns to the decorator and tree view
                this.decorator.setPatterns(this.patterns);
                this.activityBar.setPatterns(this.patterns);

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

    // refreshActivityBar will populate the tree view using the latest tags
    public refreshActivityBar() {
        this.activityBar.refresh(this.tags.getTagsAsMap(this.patterns));
    }
    
    // refreshStatusBar will update the tag count in the status bar
    public refreshStatusBar(): void {
        this.statusBar.refresh(this.settings.statusBar, this.tags.length, this.tags.getTagsAsMap(this.patterns));
    }

    // refreshDecorations will decorate the active text editor using the latest tags
    public refreshDecorations(editors?: vscode.TextEditor[]): void {
        
        // Init
        if (!editors) {
            editors = vscode.window.visibleTextEditors;
        }
        
        // Loop through the editors and refresh them
        for (let editor of editors) {
            if (utils.shouldSearchDocument(editor.document, this.settings.include, this.settings.exclude)) {
                this.decorator.refresh(editor, this.tags.getTagsAsMap(this.patterns, editor.document));
            }
        }
    }
    
    // refresh will perform a full update of all tags and refresh the tree view and decorations
    public refresh(): void {
        this.refreshActivityBar();
        this.refreshStatusBar();
        this.refreshDecorations();
    }

    // goToTag will navigate to the provided tag or show a quick pick to select a tag to navigate to
    public goToTag(tag?: Tag, preview: boolean = true): void {

        // Tag parsed in
        if (tag) {
            tag.go(this.settings.goToBehaviour, preview);
        }

        // Display a list of tags to navigate to
        else {   

            try {

                // Get patterns as quick pick items
                let quickPickItemPattern: vscode.QuickPickItem[] = [];
                for (let [index, pattern] of this.patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this.patterns[id];
                        let tags: Tags = this.tags.getTags(pattern);
                        
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
                                tags[id].go(this.settings.goToBehaviour, preview);
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
                for (let [index, pattern] of this.patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this.patterns[id];
                        let tags: Tags = this.tags.getTags(pattern);
                        
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

    //
    // Helpers
    //

    // Update all the tag views
    private async update(): Promise<void> {
        try {
            this.patterns.update(this.settings.patterns, this.settings.defaultPattern);
            await this.tags.update(this.patterns, this.settings.include, this.settings.exclude);
        } catch (err) {
            log.Error(err);
        }
    }
}