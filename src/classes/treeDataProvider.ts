'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as log from '../log';
import { Tags, Pattern, TreeItem } from './';

// TreeDataProvider will provide data to the tag view in the tagger activity tab
export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {

	constructor(
		private _patterns: Pattern[],
		private _tagMap: Map<string, Tags> = new Map()
	) {
		log.Info("Creating TreeDataProvider...");
    }

	// Variables
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

    // setPatterns will set the patterns variable
    public setPatterns(patterns: Pattern[]): void {
        this._patterns = patterns;
    }
	
	// refresh will the refresh the tree view
	public refresh(tagMap: Map<string, Tags>): void {
		
		log.Refresh("activity bar");
		
		this._tagMap = tagMap;
		this._onDidChangeTreeData.fire();
	}

	// getTreeItem ...
	public getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
    }
	
	// getChildren ...
    public getChildren(parent?: TreeItem): Thenable<TreeItem[]> {
		
		// If there is a parent, then we need to return tags
		if (parent && parent.pattern) {
			
			// Get a list of tags for the parent pattern
			return Promise.resolve(this._getTagTreeItems(parent.pattern));
		}

		// If there's no parent, get a list of patterns
		return Promise.resolve(this._getPatternTreeItems());
	}

	//
	// Helpers
	//

	// getPatternTreeItems returns a list of TreeItems containing patterns
	private _getPatternTreeItems(): TreeItem[] {

		log.Debug("Getting pattern tree items...");

		// Init
		let patternTreeItems: TreeItem[] = [];
		let count: number;

		// Loop through the patterns
		for (let pattern of this._patterns) {

			// Get the number of tags for this pattern
			count = (this._tagMap.get(pattern.name) || new Tags()).length;

			// Create the tree item
			patternTreeItems.push(new TreeItem(
				"pattern",
				pattern.name.toUpperCase(),
				`(${count})`,
				vscode.TreeItemCollapsibleState.Expanded,
				pattern
			));
		}

		return patternTreeItems;
	}

	// getTagTreeItems returns a list of TreeItems containing tags for a parent pattern
    private _getTagTreeItems(pattern: Pattern): TreeItem[] {

		log.Debug(`Getting tags tree items for pattern: '${pattern.name}'...`);

		// Init
		let tagTreeItems: TreeItem[] = [];
		
		// Loop through the tags
		for (let tag of this._tagMap.get(pattern.name) || []) {

			// Create the tree item
			tagTreeItems.push(new TreeItem(
				"tag",
				tag.pretty(),
				path.basename(tag.filepath),
				vscode.TreeItemCollapsibleState.None,
				pattern,
				tag,
				{
					command: 'tagger.goToTag',
					title: '',
					arguments: [undefined, tag],
				}
			));
		}
		
		return tagTreeItems;
    }
}
