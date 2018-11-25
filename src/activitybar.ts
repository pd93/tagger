'use strict';

import * as vscode from 'vscode';
import * as utils from './utils';
import * as structures from './structures';
import * as path from 'path';

// TaggerTreeItem corresponds to a single tag item listed in the TagTree
export class TaggerTreeItem extends vscode.TreeItem {

	constructor(
		public readonly type: string,
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly pattern?: structures.Pattern,
		public readonly tag?: structures.Tag,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		console.log(`- Creating TaggerTreeItem of type '${this.type}'...`);

		// Ensure type is valid
		if (type !== "tag" && type !== "pattern") {
			throw new Error("Type must be 'pattern' or 'tag'");				
		}

		// Ensure that if the type is 'pattern', a pattern is set
		if (type === "pattern" && !this.pattern) {
			throw new Error("No pattern given for TaggerTreeItem with type: 'pattern'");
		}
		
		// Ensure that if the type is 'tag', a tag is set
		if (type === "tag" && !this.tag) {
			throw new Error("No tag given for TaggerTreeItem with type: 'tag'");
		}
		
		// If the tree item is a 'tag', set the icon
		if (type === "tag") {
			this.iconPath = {
				light: path.join(__filename, '..', '..', 'res', 'light', 'tag.svg'),
				dark: path.join(__filename, '..', '..', 'res', 'dark', 'tag.svg')
			};
		}
	}

	// Tooltip will return a string to be displayed when hovering over the tree item
    get tooltip(): string {
		if (this.type === "pattern" && this.pattern) {
			return `${this.pattern.pattern}`;
		} else if (this.type === "tag" && this.tag) {
			return `File: '${this.tag.filepath}' Line: ${this.tag.start.line + 1} Col: ${this.tag.start.character + 1}`;
		} else {
			return "";
		}
	}
}

// TaggerTreeDataProvide will provide data to the tag view in the tagger activity tab
export class TaggerTreeDataProvider implements vscode.TreeDataProvider<TaggerTreeItem> {

	constructor(
		private patterns: structures.Pattern[],
		private include: string,
		private exclude: string,
		private maxResults: number
	) {
		console.log("Creating TagTreeDataProvider...");
    }

	// Variables
    private _onDidChangeTreeData: vscode.EventEmitter<TaggerTreeItem | undefined> = new vscode.EventEmitter<TaggerTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaggerTreeItem | undefined> = this._onDidChangeTreeData.event;
	private tags: Map<string, structures.Tag[]> = new Map();

	// Refresh will the refresh the tree view
	public async refresh(): Promise<void> {
		await this.updateTags();
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
		return Promise.resolve(this.getTagTreeItems(<structures.Pattern>parent.pattern));
	}

	// UpdateTags will loop through the workspace files and patterns and place the resulting tags in a map
	public async updateTags() {

		console.log('Updating tree view tags...');

		// Init
		let map: Map<string, structures.Tag[]> = new Map();
		let tags: structures.Tag[] | undefined;

		// Get a list of files in the workspace
		let files = await vscode.workspace.findFiles(this.include, this.exclude, this.maxResults);

		// Loop through the files
		for (let file of files) {

			console.log(`- Scanning file: '${file.fsPath}'`);

			// Get the file as a TextDocument
			let document = await vscode.workspace.openTextDocument(file.fsPath);
			
			// Loop through the patterns
			for (let pattern of this.patterns) {

				// Check for existing entries
				tags = map.get(pattern.name) || [];

				// Join the existing entries with the new ones
				tags.push(...utils.findTagsByPattern(pattern, document));
		
				// Set the map entry
				map.set(pattern.name, tags);
			}
		}

		this.tags = map;
	}
	
	// GetPatternTreeItems returns a list of TaggerTreeItems containing patterns
	private getPatternTreeItems(): TaggerTreeItem[] {

		console.log("Getting patterns as TreeItems...");

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
    private getTagTreeItems(pattern: structures.Pattern): TaggerTreeItem[] {

		console.log(`Getting tags as TreeItems for pattern: '${pattern.name}'...`);

		// Init
		let tagTreeItems: TaggerTreeItem[] = [];

		// Get the tags for this pattern
		let tags = this.tags.get(pattern.name);
		if (!tags) {
			return [];
		}

		// Loop through the tags
		for (let tag of tags) {
			tagTreeItems.push(new TaggerTreeItem(
				"tag",
				tag.text,
				vscode.TreeItemCollapsibleState.None,
				undefined,
				tag
			));
		}
		
		return tagTreeItems;
    }
}
