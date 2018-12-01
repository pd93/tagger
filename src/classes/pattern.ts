'use strict';

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

export class Pattern {

    constructor(
        public name: string,
        pattern: string,
        caseSensitive: boolean,
        public style: Style
    ) {
        // Create a new RegExp object
        if (caseSensitive) {
            this.regexp = new RegExp(pattern, 'g');
        } else {
            this.regexp = new RegExp(pattern, 'gi');
        }
    }

    public regexp: RegExp;
}