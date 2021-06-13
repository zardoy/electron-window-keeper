import { app, BrowserWindow, Rectangle } from "electron";
import ElectronStore, { Options as StoreOptions } from "electron-store";
import path from "path";
import { pick, debounce, omit, mapValues, clamp } from "lodash";

import { JSONSchema } from "json-schema-typed";

type PickedStoreOptions = Pick<StoreOptions<any>, "fileExtension" | "cwd" | "serialize" | "deserialize">;

/** 
 * By default, this module trying to help you with tracking fileNames when creating new class instances and raising an **error** when you use the same file path twice.
 * 
 * I think it shouldn't create any problems, until someone realise how to use HMR in Electron.
 * 
 * Set this to `true` before the first class created to disable it.
 * @default false */
export let disableTrackingOfFileNames = false;

// todo use deep partial
interface Options extends PickedStoreOptions {
    /**
     * Set to `false`, to throw TypeError on loading invalid JSON config from file.
     * @default true
     */
    clearInvalidConfig?: boolean;
    /**
     * Name of the file **without extension**, that stored in `cwd` option
     * @default "window-state"
     */
    fileName?: string;
    /** Set it to `false` to disable maximized state management. In this case you can use `maximze()` / `minimize()` on browserWindow directly
     * @default It preserves window maximized state
     */
    maximized?: false | {
        /** 
         * Whether window should be maximized by default (on the first run for example)
         * @default true
         *  */
        default?: boolean;
    };
    // todo implement
    // mapPositionAndSizeOnResolutionChange: false | "only-load" | "always"
}

const propsToPreserve = {
    numeric: ["x", "y", "width", "height"],
    boolean: ["fullscreen", "maximized"]
} as const;

const usedFilePaths = new Set<string>();

export default class ElectronWindowKeeper {
    private electronStore: ElectronStore;

    /** Pass todo. It won't upate */
    public restoredState: Rectangle & { fullscreen: boolean; };
    /** Including maximized */
    public restoredFullState: Rectangle & Record<(typeof propsToPreserve["boolean"])[number], boolean>;
    public filePath: string;

    constructor(
        public options: Options = {}
    ) {
        // todo use lodash.defaults or something like that
        const {
            clearInvalidConfig = true,
            fileName = "window-state",
            ...restOptions
        } = options;

        const customFileOrPathSet = "fileName" in options || "cwd" in options;
        const defaultCwd = app.getPath("userData");
        // https://github.com/sindresorhus/electron-store/tree/main/index.js#L60
        const cwd = restOptions.cwd ?
            path.isAbsolute(restOptions.cwd) ? restOptions.cwd : path.join(defaultCwd, restOptions.cwd) :
            defaultCwd;
        const filePath = path.join(cwd, `${fileName}.${restOptions.fileExtension ?? "json"}`);
        // todo learn english or how to specify more user-friendly messages
        if (usedFilePaths.has(filePath)) throw new Error(`This file (${customFileOrPathSet ? "default values" : filePath}) was already used for another window. Please, specify another file name via "fileName" constructor option or disable tracking of used file names via "disableTrackingOfFileNames" named export.`);
        usedFilePaths.add(filePath);

        // try to type store
        this.electronStore = new ElectronStore({
            clearInvalidConfig,
            name: fileName,
            schema: {
                ...Object.fromEntries(
                    propsToPreserve.numeric.map(prop => [prop, {
                        type: "number",
                        minimum: 0
                    } as JSONSchema])
                ),
                ...Object.fromEntries(
                    propsToPreserve.boolean.map(prop => [prop, {
                        type: "boolean"
                    } as JSONSchema])
                )
            },
            ...restOptions
        });
        this.filePath = this.electronStore.path;
        this.restoredFullState = pick(this.electronStore.store, [...propsToPreserve.numeric, ...propsToPreserve.boolean]) as any;
        this.restoredState = omit(this.restoredFullState, "maximized");
    }

    manuallySaveState(browserWindow: BrowserWindow) {
        const bounds =
            mapValues(
                browserWindow.getBounds(),
                value => clamp(value, 0)
            );

        this.electronStore.set({
            ...bounds,
            fullscreen: browserWindow.isFullScreen(),
            maximized: browserWindow.isMaximized()
        });
    }

    /**
     * Like in electron-window-state, it sets maximized state (if not disabled) and watches for movement/resizing the window
     */
    manage(browserWindow: BrowserWindow) {
        // fullscreen controlled via prop
        const { maximized: maximizedConfig } = this.options;
        if (maximizedConfig !== false) {
            // todo test false option
            if (
                ("maximized" in this.restoredFullState && this.restoredFullState.maximized) ||
                (maximizedConfig?.default ?? true)
            ) browserWindow.maximize();
        }

        const updateState = debounce(() => this.manuallySaveState(browserWindow), 500);

        browserWindow.on("move", updateState);
        browserWindow.on("resize", updateState);
    }
}