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
    start: number;
    end: number;
}