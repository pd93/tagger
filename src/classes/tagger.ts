'use strict';

import * as vscode from 'vscode';
import * as minimatch from 'minimatch';
import * as log from '../utils/log';
import { Tag, Tags, Pattern, TaggerTreeDataProvider, TaggerTreeItem, Decorator, Settings } from './';

export class Tagger {

    constructor(
        private context: vscode.ExtensionContext
    ) {

        log.Info("Creating an instance of Tagger...");

        // Get the tagger settings
        this.settings = new Settings();

        // Create a filesystem watcher
        this.watcher = vscode.workspace.createFileSystemWatcher(this.settings.include);

        // Register a decorator
        this.registerDecorator(new Decorator(this.settings.patterns));

        // Register a tree view
        this.registerTreeDataProvider(new TaggerTreeDataProvider(this.settings.patterns));

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
    public settings: Settings;
    public tags: Tags = new Tags();
    private taggerTreeDataProvider!: TaggerTreeDataProvider;
    private decorator!: Decorator;
    private watcher: vscode.FileSystemWatcher;

    //
    // Registrars
    //

    // registerTreeDataProvider will register the tree view the tagger instance and vscode
    public registerTreeDataProvider(taggerTreeDataProvider: TaggerTreeDataProvider): void {
        
        this.taggerTreeDataProvider = taggerTreeDataProvider;

        // Register the tree view with its data provider
        vscode.window.createTreeView('tagger-tags', {
            treeDataProvider: this.taggerTreeDataProvider
        });
    }

    // registerDecorator will register the decorator with the tagger instance
    public registerDecorator(decorator: Decorator): void {
        this.decorator = decorator;
    }

    // registerListeners will register the listen events with the tagger instance and vscode
    public registerListeners(): void {      

        if (this.settings.updateOn === "change") {

            vscode.workspace.onDidChangeTextDocument(event => {

                if (this.shouldSearchDocument(event.document)) {

                    log.Event("doc change", event.document.uri.fsPath);
                    
                    // Update tags for the file that changed
                    this.tags.updateForDocument(this.settings.patterns, event.document);
                    
                    // Refresh the tree view
                    this.refreshActivityBar();
                    
                    // If the file tht changed is currently open, update the decorations too
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
                
                if (this.shouldSearchFile(uri)) {
    
                    log.Event("fs change", uri.fsPath);
            
                    // Update tags for the file that changed
                    if (await this.tags.updateForFile(this.settings.patterns, uri) >= 0) {
                        
                        // Refresh the tree view
                        this.refreshActivityBar();
                        
                        // If the file tht changed is currently open, update the decorations too
                        if (vscode.window.activeTextEditor && uri.fsPath === vscode.window.activeTextEditor.document.fileName) {
                            this.refreshDecorations();
                        }
                    }
                } else {
                    log.Event("fs change", `[skipped] ${uri.fsPath}`);
                }
            });
            
            // When a file on the system is created
            this.watcher.onDidCreate(async uri => {

                if (this.shouldSearchFile(uri)) {
    
                    log.Event("fs create", uri.fsPath);
                
                    // Update tags for the file that changed
                    if (await this.tags.updateForFile(this.settings.patterns, uri) > 0) {
                        
                        // Refresh the tree view
                        this.refreshActivityBar();
                        
                        // If the file tht changed is currently open, update the decorations too
                        if (vscode.window.activeTextEditor && uri.fsPath === vscode.window.activeTextEditor.document.fileName) {
                            this.refreshDecorations();
                        }
                    }
                } else {
                    log.Event("fs create", `[skipped] ${uri.fsPath}`);
                }
            });
            
            // When a file on the system is deleted
            this.watcher.onDidDelete(async uri => {

                if (this.shouldSearchFile(uri)) {
    
                    log.Event("fs delete", uri.fsPath);
                
                    // Update tags for the file that changed
                    if (await this.tags.removeForFile(uri) > 0) {
                        
                        // Refresh the tree view
                        this.refreshActivityBar();
                        
                        // If the file tht changed is currently open, update the decorations too
                        if (vscode.window.activeTextEditor && uri.fsPath === vscode.window.activeTextEditor.document.fileName) {
                            this.refreshDecorations();
                        }
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

                // Send the new patterns to the decorator and tree view
                this.decorator.setPatterns(this.settings.patterns);
                this.taggerTreeDataProvider.setPatterns(this.settings.patterns);

                // Refresh everything
                this.update().then(() => {
                    this.refresh();
                });
            }
        });
    }

    public registerCommands(): void {

        // Refresh tree view
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refreshActivityBar', () => {
            this.refreshActivityBar();
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
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.goToTag', (taggerTreeItem?: TaggerTreeItem, tag?: Tag) => {
            if (taggerTreeItem && taggerTreeItem.tag) {
                this.goToTag(taggerTreeItem.tag, false);
            } else if (tag) {
                this.goToTag(tag);
            } else {
                this.goToTag(undefined);
            }
        }));
        
        // Delete a tag
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.deleteTag', (taggerTreeItem?: TaggerTreeItem) => {
            this.deleteTag(taggerTreeItem ? taggerTreeItem.tag : undefined);
        }));
    }
    
    //
    // Commands
    //

    // refreshActivityBar will populate the tree view using the latest tags
    public refreshActivityBar() {
        this.taggerTreeDataProvider.refresh(this.tags.getTagsAsMap(this.settings.patterns));
    }

    // refreshDecorations will decorate the active text editor using the latest tags
    public refreshDecorations(editors?: vscode.TextEditor[]): void {
        
        // Init
        if (!editors) {
            editors = vscode.window.visibleTextEditors;
        }
        
        // Loop through the editors and refresh them
        for (let editor of editors) {
            if (this.shouldSearchDocument(editor.document)) {
                this.decorator.refresh(editor, this.tags.getTagsAsMap(this.settings.patterns, editor.document));
            }
        }
    }
    
    // refresh will perform a full update of all tags and refresh the tree view and decorations
    public refresh(): void {
        this.refreshActivityBar();
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
                for (let [index, pattern] of this.settings.patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this.settings.patterns[id];
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
                for (let [index, pattern] of this.settings.patterns.entries()) {
                    quickPickItemPattern.push({
                        label: `${index + 1}: ${pattern.name.toUpperCase()}`,
                        description: pattern.regexp.source,
                    });
                }
                
                // Show the quick pick menu
                vscode.window.showQuickPick(quickPickItemPattern).then(selection => {

                    if (selection) {

                        let id: number = parseInt(selection.label.substring(0, selection.label.indexOf(":"))) - 1;
                        let pattern: Pattern = this.settings.patterns[id];
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
            await this.tags.update(this.settings.patterns, this.settings.include, this.settings.exclude);
        } catch (err) {
            log.Error(err);
        }
    }
    
    // shouldSearchDocument returns whether or not tagger should search for tags in a given file
    private shouldSearchFile(uri: vscode.Uri) {
        let excludeRegExp: RegExp = new RegExp(/^(?:\\\d+\\.*|.*settings.json)$/);
        return !excludeRegExp.test(uri.fsPath) && minimatch.match([uri.fsPath], this.settings.exclude).length === 0;
    }

    // shouldSearchDocument returns whether or not tagger should search for tags in a given document
    private shouldSearchDocument(document: vscode.TextDocument) {
        return !document.isUntitled && this.shouldSearchFile(document.uri);
    }
}