import { BrowserWindow, Rectangle } from "electron";
import { Options as StoreOptions } from "electron-store";
declare type PickedStoreOptions = Pick<StoreOptions<any>, "fileExtension" | "cwd" | "serialize" | "deserialize">;
/**
 * By default, this module trying to help you with tracking fileNames when creating new class instances and raising an **error** when you use the same file path twice.
 *
 * I think it shouldn't create any problems, until someone realise how to use HMR in Electron.
 *
 * Set this to `true` before the first class created to disable it.
 * @default false */
export declare let disableTrackingOfFileNames: boolean;
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
}
declare const propsToPreserve: {
    readonly numeric: readonly ["x", "y", "width", "height"];
    readonly boolean: readonly ["fullscreen", "maximized"];
};
export default class ElectronWindowKeeper {
    options: Options;
    private electronStore;
    /** Pass todo. It won't upate */
    restoredState: Partial<Rectangle & {
        fullscreen: boolean;
    }>;
    /** Including maximized */
    restoredFullState: Partial<Rectangle & Record<(typeof propsToPreserve["boolean"])[number], boolean>>;
    filePath: string;
    constructor(options?: Options);
    manuallySaveState(browserWindow: BrowserWindow): void;
    /**
     * Like in electron-window-state, it sets maximized state (if not disabled) and watches for movement/resizing the window
     */
    manage(browserWindow: BrowserWindow): void;
}
export {};
