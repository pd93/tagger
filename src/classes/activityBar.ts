'use strict';

import * as vscode from 'vscode';
import * as log from '../log';
import { Pattern, Tags, TreeDataProvider } from './';

// TreeView
export class ActivityBar {

    constructor(
        patterns: Pattern[]
    ) {
        log.Info("Creating TreeView...");

        // Create the data provider
        this._treeDataProvider = new TreeDataProvider(patterns);
        
        // Register the tree view with its data provider
        vscode.window.createTreeView('tagger-tags', {
            treeDataProvider: this._treeDataProvider,
            showCollapseAll: true
        });
    }

    // Variables
    private _treeDataProvider: TreeDataProvider;

    // refresh
    public refresh(tagMap: Map<string, Tags>) {
        this._treeDataProvider.refresh(tagMap);
    }

    // setPatterns
    public setPatterns(patterns: Pattern[]) {
        this._treeDataProvider.setPatterns(patterns);
    }
}