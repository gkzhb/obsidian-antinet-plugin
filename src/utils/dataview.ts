import { DataviewApi, getAPI } from "obsidian-dataview";

import { app } from "./obsidian";

export let dv: DataviewApi;
export const getDv = () => {
	if (!dv) {
		const api = getAPI(app);
		if (api) {
			dv = api;
		} else {
			// handle error dataview not loaded
			console.error("dataview not found!");
			throw new Error("Dataview plugin not found");
		}
	}

	return dv;
};

export interface DvPage {
	file: {
path: string;
}
}
