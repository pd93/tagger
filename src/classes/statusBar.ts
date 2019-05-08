'use strict';

import * as vscode from 'vscode';
import * as log from '../log';
import { IStatusBarSettings, Tags } from './';

export class StatusBar {

    constructor() {
        log.Info("Creating StatusBar...");
    }

    // refresh will update the tag count displayed in the status bar
    public refresh(statusBarSettings: IStatusBarSettings, count: number, tagMap: Map<string, Tags>) {

        if (statusBarSettings.enabled) {

            log.Refresh("status bar");

            // Init
            let output = statusBarSettings.output;

            // Replace place-holders with values
            output = output.replace(/{[a-z]+}/gi, (text) => {
                if (text === "{all}") {
                    return count.toString();
                } else {
                    let name = text.substring(1, text.length-1);
                    let tags = tagMap.get(name) || [];
                    return tags.length.toString();
                }
            }); 

            // Set the status bar message
            vscode.window.setStatusBarMessage(output);
            
        } else {

            // Set the status bar message to nothing
            vscode.window.setStatusBarMessage("");
        }
    }
}
