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

export interface Link {
	/** 显示文本（可选） */
	display?: string;
	/** 子路径，用于定位到文档中的特定位置（可选） */
	subpath?: string;
	/** 文件路径 */
	path: string;
	/** 是否为嵌入链接 */
	embed: boolean;
	/** 链接类型：file(文件) | header(标题) | block(块) */
	type: "file" | "header" | "block";
}

export interface DvPage {
	file: {
		/** 文件名（在 Obsidian 侧边栏中显示的名称） */
		name: string;
		/** 文件所在的文件夹路径 */
		folder: string;
		/** 完整的文件路径，包含文件名 */
		path: string;
		/** 文件扩展名，通常为 'md' */
		ext: string;
		/** 文件链接对象 */
		link: Link;
		/** 文件大小（字节） */
		size: number;
		/** 文件创建时间（日期时间） */
		ctime: Date;
		/** 文件创建日期 */
		cday: Date;
		/** 文件最后修改时间（日期时间） */
		mtime: Date;
		/** 文件最后修改日期 */
		mday: Date;
		/** 所有唯一标签列表，子标签会分解存储 */
		tags: string[];
		/** 所有显式标签列表，子标签不会分解 */
		etags: string[];
		/** 所有指向此文件的入链列表 */
		inlinks: Link[];
		/** 此文件中所有指向外部的出链列表 */
		outlinks: Link[];
		/** 文件的所有别名列表 */
		aliases: string[];
		/** 文件中的所有任务列表 */
		tasks: any[];
		/** 文件中的所有列表元素 */
		lists: any[];
		/** 文件的前置元数据原始值 */
		frontmatter: Record<string, any>;
		/** 文件名中的日期或 Date 字段中的日期（如果有） */
		day?: Date;
		/** 文件是否被收藏（通过书签插件） */
		starred: boolean;
	};
}
