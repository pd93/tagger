'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Tagger } from './tagger';
import { Pattern } from '../interfaces';
import { TaggerTreeItem } from './taggerTreeItem';

// TaggerTreeDataProvide will provide data to the tag view in the tagger activity tab
export class TaggerTreeDataProvider implements vscode.TreeDataProvider<TaggerTreeItem> {

	constructor(
		private tagger: Tagger
	) {
		log.Debug("Creating TagTreeDataProvider...");
    }

	// Variables
    private _onDidChangeTreeData: vscode.EventEmitter<TaggerTreeItem | undefined> = new vscode.EventEmitter<TaggerTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaggerTreeItem | undefined> = this._onDidChangeTreeData.event;

	// Refresh will the refresh the tree view
	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	// GetTreeItem ...
	public getTreeItem(element: TaggerTreeItem): vscode.TreeItem {
		return element;
    }
	
	// GetChildren ...
    public getChildren(parent?: TaggerTreeItem): Thenable<TaggerTreeItem[]> {

		// If there's no parent, get a list of patterns
		if (!parent) {
			return Promise.resolve(this.getPatternTreeItems());
		}
		
		// Otherwise, get a list of tags for the parent pattern
		return Promise.resolve(this.getTagTreeItems(<Pattern>parent.pattern));
	}

	// GetPatternTreeItems returns a list of TaggerTreeItems containing patterns
	private getPatternTreeItems(): TaggerTreeItem[] {

		log.Debug("Getting patterns as TreeItems...");

		// Init
		let patternTreeItems: TaggerTreeItem[] = [];

		// Loop through the patterns
		for (let pattern of this.tagger.settings.patterns) {
			patternTreeItems.push(new TaggerTreeItem(
				"pattern",
				pattern.name.toUpperCase(),
				vscode.TreeItemCollapsibleState.Expanded,
				pattern
			));
		}

		return patternTreeItems;
	}

	// GetTagTreeItems returns a list of TaggerTreeItems containing tags for a parent pattern
    private getTagTreeItems(pattern: Pattern): TaggerTreeItem[] {

		log.Debug(`Getting tags as TreeItems for pattern: '${pattern.name}'...`);

		// Init
		let tagTreeItems: TaggerTreeItem[] = [];

		// Get the tags for this pattern
		let tags = this.tagger.getTagsForPattern(pattern);
		
		// Loop through the tags
		for (let tag of tags) {
			tagTreeItems.push(new TaggerTreeItem(
				"tag",
				`<span class="taggerTreeItem">${tag.text}</span>`,
				// tag.text,
				vscode.TreeItemCollapsibleState.None,
				undefined,
				tag
			));
		}
		
		return tagTreeItems;
    }
}
