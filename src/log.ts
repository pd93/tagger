'use strict';

var debug = false;

export function Info(message: string) {
    log("info", message);
}

export function Debug(message: string) {
    if (debug) {
        log("debug", message);
    }
}

export function setDebugLogging(enabled: boolean) {
    debug = enabled;
}

function log(level: string, message: string) {
    console.log(`[${level}] ${message}`);
}