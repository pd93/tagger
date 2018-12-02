'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Tag, Tags, TaggerTreeDataProvider, Decorator, Settings } from './';

export class Tagger {

    constructor(
        private context: vscode.ExtensionContext
    ) {

        log.Info("Creating an instance of Tagger...");

        // Get the tagger settings
        this.settings = new Settings();

        // Register a decorator
        this.registerDecorator(new Decorator(this.settings.patterns));

        // Register a tree view
        this.registerTreeDataProvider(new TaggerTreeDataProvider(this.settings.patterns));

        // Register listeners
        this.registerListeners();

        // Register commands
        this.registerCommands();

        // Refresh everything
        // this.refresh();
    }

    // Variables
    public settings: Settings;
    public tags: Tags = new Tags();
    private taggerTreeDataProvider!: TaggerTreeDataProvider;
    private decorator!: Decorator;

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

    public registerListeners(): void {      

        switch (this.settings.updateOn) {

            // Listen to document change events
            case "change":

                vscode.workspace.onDidChangeTextDocument(event => {

                    // Update tags for the file that changed
                    this.tags.updateForDocument(this.settings.patterns, event.document);

                    // Refresh the tree view
                    this.refreshTreeView();

                    // If the file tht changed is currently open, update the decorations too
                    if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                        this.refreshDecorations();
                    }

                }, null, this.context.subscriptions);

                break;

            // Listen to save document events
            case "save":

                vscode.workspace.onDidSaveTextDocument(event => {

                    // Update tags for the file that changed
                    this.tags.updateForFile(this.settings.patterns, event.uri);

                    // Refresh the tree view
                    this.refreshTreeView();

                    // If the file tht changed is currently open, update the decorations too
                    if (vscode.window.activeTextEditor && event.fileName === vscode.window.activeTextEditor.document.fileName) {
                        this.refreshDecorations();
                    }

                }, null, this.context.subscriptions);
                break;
        }

        // Listen for when the active editor changes
        vscode.window.onDidChangeActiveTextEditor(editor => {

            // If the editor is active, refresh the decorations
            if (editor) {
                this.refreshDecorations();
            }

        }, null, this.context.subscriptions);

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
                this.refresh();
            }
        });
    }

    public registerCommands(): void {
        
        // Refresh everything
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.refresh', () => {
            this.refresh();
        }));
        
        // Navigate to a tag
        this.context.subscriptions.push(vscode.commands.registerCommand('tagger.goToTag', (tag: Tag) => {
            tag.go();
        }));
    }
    
    //
    // Refresh
    //

    // refreshTreeView will populate the tree view using the latest tags
    public refreshTreeView() {
        this.taggerTreeDataProvider.refresh(this.tags.getTagsAsMap(this.settings.patterns));
    }

    // refreshDecorations will decorate the active text editor using the latest tags
    public refreshDecorations(): void {
        
        // Ensure there is an active editor
        let editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document) {
            return;
        }

        this.decorator.refresh(this.tags.getTagsAsMap(this.settings.patterns, editor.document));
    }
    
    // refresh will perform a full update of all tags and refresh the tree view and decorations
    public async refresh(): Promise<void> {

        try {

            // Update all the tags
            await this.tags.update(this.settings.patterns, this.settings.include, this.settings.exclude);
            
            // Refresh the tree view and decorations
            this.refreshTreeView();
            this.refreshDecorations();

        } catch (err) {
            console.log(err);
        }
    }
}