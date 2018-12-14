'use strict';

import * as vscode from 'vscode';
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

        // Create a filesystem watcher
        this.watcher = vscode.workspace.createFileSystemWatcher(this.settings.include);

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
    private watcher: vscode.FileSystemWatcher;

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

        if (this.settings.updateOn === "change") {

            vscode.workspace.onDidChangeTextDocument(event => {

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
                
            }, null, this.context.subscriptions);
        }

        if (this.settings.updateOn !== "manual") {
            
            // When a file on the system is changed
            this.watcher.onDidChange(async uri => {
                
                if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                    
                    // Update tags for the file that changed
                    if (await this.tags.updateForFile(this.patterns, uri) >= 0) {
        
                        log.Event("fs change", uri.fsPath);

                        this.refreshActivityBar();
                        this.refreshStatusBar();
                    } else {
                        log.Event("fs change", `[failed] ${uri.fsPath}`);
                    }
                } else {
                    log.Event("fs change", `[skipped] ${uri.fsPath}`);
                }
            });
            
            // When a file on the system is created
            this.watcher.onDidCreate(async uri => {

                if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                    
                    // Update tags for the file that changed
                    if (await this.tags.updateForFile(this.patterns, uri) > 0) {
        
                        log.Event("fs create", uri.fsPath);

                        this.refreshActivityBar();
                        this.refreshStatusBar();
                    } else {
                        log.Event("fs create", `[failed] ${uri.fsPath}`);
                    }
                } else {
                    log.Event("fs create", `[skipped] ${uri.fsPath}`);
                }
            });
            
            // When a file on the system is deleted
            this.watcher.onDidDelete(async uri => {

                if (utils.shouldSearchFile(uri, this.settings.include, this.settings.exclude)) {
                    
                    // Update tags for the file that changed
                    if (await this.tags.removeForFile(uri) > 0) {
        
                        log.Event("fs delete", uri.fsPath);

                        this.refreshActivityBar();
                        this.refreshStatusBar();
                    } else {
                        log.Event("fs delete", `[failed] ${uri.fsPath}`);
                    }
                } else {
                    log.Event("fs delete", `[skipped] ${uri.fsPath}`);   
                }
            });

            // Listen for when the active editor changes
            vscode.window.onDidChangeVisibleTextEditors(editors => {

                // If the editor is active, refresh the decorations
                if (editors) {
                    this.refreshDecorations(editors);
                }

            }, null, this.context.subscriptions);
        }

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            
            // If a change was made to the tagger config
            if (event.affectsConfiguration("tagger")) {

                // Update the settings
                this.settings.update();

                // Update patterns and tags
                this.update().then(() => {
                    
                    // Send the new patterns to the decorator and tree view
                    this.decorator.setPatterns(this.patterns);
                    this.activityBar.setPatterns(this.patterns);

                    // Refresh the views
                    this.refresh();
                });
            }
        });
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
            await this.patterns.update(this.settings.patterns, this.settings.defaultPattern);
            await this.tags.update(this.patterns, this.settings.include, this.settings.exclude);
        } catch (err) {
            log.Error(err);
        }
    }
}