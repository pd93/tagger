'use strict';

import * as vscode from 'vscode';

export interface Pattern {
    name: string;
    pattern: string;
    caseSensitive: boolean;
    style: Style;
}

export interface Style {
    color: string;
    backgroundColor: string;
    underline: boolean;
    bold: boolean;
    emphasis: boolean;
}

export interface Tag {
    name: string;
    text: string;
    filepath: string;
    start: vscode.Position;
    end: vscode.Position;
}