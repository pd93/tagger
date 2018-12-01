'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as log from '../utils/log';
import { Pattern } from '../classes/pattern';
import { Tag } from '../classes/tag';

// TaggerTreeItem corresponds to a single tag item listed in the TagTree
export class TaggerTreeItem extends vscode.TreeItem {

	constructor(
		public readonly type: string,
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly pattern?: Pattern,
		public readonly tag?: Tag,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		log.Debug(`- Creating TaggerTreeItem of type '${this.type}'...`);

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
			return `${this.pattern.regexp.source}`;
		} else if (this.type === "tag" && this.tag) {
			return `File: '${this.tag.filepath}' Line: ${this.tag.start.line + 1} Col: ${this.tag.start.character + 1}`;
		} else {
			return "";
		}
	}
}
