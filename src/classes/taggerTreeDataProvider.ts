'use strict';

import * as vscode from 'vscode';
import * as log from '../utils/log';
import { Pattern, TaggerTreeItem } from './';
import { Tag } from './tag';

// TaggerTreeDataProvide will provide data to the tag view in the tagger activity tab
export class TaggerTreeDataProvider implements vscode.TreeDataProvider<TaggerTreeItem> {

	constructor(
		private patterns: Pattern[],
		private tagMap: Map<string, Tag[]> = new Map()
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
	public refresh(tagMap: Map<string, Tag[]>): void {
		
		log.Info("--- refreshing tree view ---");
		
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

		log.Debug("Getting patterns as TreeItems...");

		// Init
		let patternTreeItems: TaggerTreeItem[] = [];

		// Loop through the patterns
		for (let pattern of this.patterns) {
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
		let cmd: vscode.Command;
		
		// Loop through the tags
		for (let tag of this.tagMap.get(pattern.name) || []) {

			cmd = {
				command: 'tagger.goToTag',
				title: '',
				arguments: [tag],
			};

			tagTreeItems.push(new TaggerTreeItem(
				"tag",
				tag.text,
				vscode.TreeItemCollapsibleState.None,
				undefined,
				tag,
				cmd
			));
		}
		
		return tagTreeItems;
    }
}
