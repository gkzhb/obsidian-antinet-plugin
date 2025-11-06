import { App } from "obsidian";

export let app: App;

export const setApp = (value: App) => {
	app = value;
};
