'use strict';

import chalk from 'chalk';

chalk.enabled = true;
chalk.level = 1;

export function Info(message: string) {
    log("info", message);
}

export function Debug(message: string) {
    log("debug", message);
}

export function Event(event: string, message: string) {
    log("event", `[${event}] ${message}`);
}

export function Refresh(refresh: string, message: string) {
    log("refresh", `[${refresh}] ${message}`);
}

export function Error(err: Error) {
    log("error", err.stack ? err.stack : err.message);
}

function log(level: string, message: string) {
    message = `[${level}] ${message}`;
    switch (level) {
        case "info":
            console.log(message);
            break;
        case "debug":
            console.log(chalk.blue(message));
            break;
        case "event":
            console.log(chalk.green(message));
            break;
        case "refresh":
            console.log(chalk.magenta(message));
            break;
        case "error":
            console.error(chalk.red(message));
            break;
    }
}