# pd93 / tagger

A VSCode extension to view, highlight and manage in-code tags.

## Settings

In the example configuration below, the `todo` pattern will tag any text (starting with or without a comment) with the case-sensitive term `TODO:` followed by a string. Tagger will search in all (non-binary) files in the workspace (except for the `node_modules` folder) and all the found `todo` tags will be highlighted with a red background and white text.

You may define as many patterns as you like, but each pattern **must** contain a name and a pattern string (regular expression). The default style and properties will be applied to all tags unless they are overriden. An example of overriding can be seen in the `note` pattern below which overrides the default `flags` and `style` properties.

```json
{
    "tagger": {
        "updateOn": "change",
        "include": "**/*",
        "exclude": "**/node_modules/*",
        "defaultPattern": {
            "style": {
                "color": "#FFF",
                "backgroundColor": "#CF3F61",
                "overviewRulerColor": "#CF3F61"
            }
        },
        "patterns": [
            {   
                "name": "todo",
                "pattern": "(\\/\\/|#|\\/\\*)? TODO: .*"
            },
            {   
                "name": "note",
                "pattern": "(\\/\\/|#|\\/\\*)? NOTE: .*",
                "flags": "gi",
                "style": {
                    "color": "#FFF",
                    "backgroundColor": "#4C9AD4",
                    "overviewRulerColor": "#4C9AD4"
                }
            },
            {
                "name": "multiline",
                "pattern": "start[^]*end"
            }
        ]
    }
}
```

## Links

- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)
