'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as log from '../utils/log';
import { Tags, Pattern, TaggerTreeItem } from './';

// TaggerTreeDataProvide will provide data to the tag view in the tagger activity tab
export class TaggerTreeDataProvider implements vscode.TreeDataProvider<TaggerTreeItem> {

	constructor(
		private patterns: Pattern[],
		private tagMap: Map<string, Tags> = new Map()
	) {
		log.Info("Creating TagTreeDataProvider...");
    }

	// Variables
    private _onDidChangeTreeData: vscode.EventEmitter<TaggerTreeItem | undefined> = new vscode.EventEmitter<TaggerTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaggerTreeItem | undefined> = this._onDidChangeTreeData.event;

    // setPatterns will set the patterns variable
    public setPatterns(patterns: Pattern[]): void {
        this.patterns = patterns;
    }
	
	// Refresh will the refresh the tree view
	public refresh(tagMap: Map<string, Tags>): void {
		
		log.Refresh("activity bar");
		
		this.tagMap = tagMap;
		this._onDidChangeTreeData.fire();
	}

	// GetTreeItem ...
	public getTreeItem(element: TaggerTreeItem): vscode.TreeItem {
		return element;
    }
	
	// GetChildren ...
    public getChildren(parent?: TaggerTreeItem): Thenable<TaggerTreeItem[]> {
		
		// If there is a parent, then we need to return tags
		if (parent && parent.pattern) {
			
			// Get a list of tags for the parent pattern
			return Promise.resolve(this.getTagTreeItems(parent.pattern));
		}

		// If there's no parent, get a list of patterns
		return Promise.resolve(this.getPatternTreeItems());
	}

	//
	// Helpers
	//

	// GetPatternTreeItems returns a list of TaggerTreeItems containing patterns
	private getPatternTreeItems(): TaggerTreeItem[] {

		log.Debug("Getting pattern tree items...");

		// Init
		let patternTreeItems: TaggerTreeItem[] = [];
		let count: number;

		// Loop through the patterns
		for (let pattern of this.patterns) {

			// Get the number of tags for this pattern
			count = (this.tagMap.get(pattern.name) || new Tags()).length;

			// Create the tree item
			patternTreeItems.push(new TaggerTreeItem(
				"pattern",
				pattern.name.toUpperCase(),
				`(${count})`,
				vscode.TreeItemCollapsibleState.Expanded,
				pattern
			));
		}

		return patternTreeItems;
	}

	// GetTagTreeItems returns a list of TaggerTreeItems containing tags for a parent pattern
    private getTagTreeItems(pattern: Pattern): TaggerTreeItem[] {

		log.Debug(`Getting tags tree items for pattern: '${pattern.name}'...`);

		// Init
		let tagTreeItems: TaggerTreeItem[] = [];
		
		// Loop through the tags
		for (let tag of this.tagMap.get(pattern.name) || []) {

			// Create the tree item
			tagTreeItems.push(new TaggerTreeItem(
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
