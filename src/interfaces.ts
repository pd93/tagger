'use strict';

import * as vscode from 'vscode';


export interface Tag {
    name: string;
    text: string;
    filepath: string;
    start: vscode.Position;
    end: vscode.Position;
}