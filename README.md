# pd93 / tagger

A VSCode extension to view, highlight and manage in-code tags.

## Settings

Below, is an example of a tagger configuration. This example will tag any text (starting with or without a comment) with the case-sensitive term `TODO:` followed by a string. It will search in all (non-binary) files in the workspace except for the `node_modules` folder. All the tags found will then be highlighted with a red background and white text.

You may define as many patterns as you like and each pattern has its own style. Default styles and pattern specific include/exclude rules are not currently available, but are coming in a future release!

```json
{
    "tagger": {
        "updateOn": "change",
        "include": "",
        "exclude": "**/node_modules/*",
        "patterns": [
            {   
                "name": "todo",
                "pattern": "(\\/\\/|#|\\/\\*)? TODO: .*",
                "caseSensitive": true,
                "style": {
                    "color": "#FFF",
                    "backgroundColor": "#CF3F61",
                    "overviewRulerColor": "#CF3F61",
                    ...
                }
            },
            ...
        ]
    }
}
```

## Links

- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)
