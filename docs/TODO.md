# 项目

## 背景

建设 Agent 的长期存储知识库。

基于 Antinet Zettelkasten 的核心思想进行方案设计。

Antinet Zettelkasten 是 Scott P. Scheper 编写的书籍，详细介绍了卢曼盒卡片法，具体见 [Antinet Zettelkasten Book](https://www.scottscheper.com/antinet)。

## Antinet Zettelkasten 思想

笔记主卡片内容是随着时间不断动态生长沉淀出来的。每张主卡片都有它固定的上下文，这些上下文来自于树状编号树中的相邻和祖先节点卡片。

每张主卡片都有一个数字字母组成的唯一编号，比如 3.1a2c 。这个编号会将卡片组织为一个固定的树状结构，比如 3.1a2 主卡片是 3.1a2c 卡片的父亲节点，它们又都有着一个共同的根节点 3.1。

主卡片之间可以通过这个编号来链接到其他树状分支的卡片上，比如在某张主卡片上使用 [[3.1a2c]] 来指向 3.1a2c 主卡片。

这些链接的建立需要审慎地决定，它需要反映某种深刻的思想上的关联性。应当避免无意义地随意链接关联卡片。

## 本项目知识库的实现思路

借助 Obsidian 提供的现成笔记体系能力及 UI 交互（方便用户查阅修改），开发一个 Obsidian Plugin 来在 Obsidian 中提供 Antinet MCP Server 服务。
MCP Server 它将提供遵循 Antinet Zettelkasten 思想的工具来操作 Obsidian 笔记。

更具体的方案：
1. 主卡片存放在统一路径 `ZK_MainBox/` 下（表示主卡片盒），每张主卡片的文件名作为 Antinet 卡片编号，比如 `3.1a2c.md`
2. 为了避免主卡片内容过长，编辑保存主卡片时，限制内容字符串长度不可超过 4000；允许追加内容（比如说明更新内容见 xxx 新的主卡片）但内容（字符串长度）限制在 200 字以内
3. 为了 Agent 在不同工作目录下进行记忆存储使用，在主卡片盒中设计一种根节点卡片：项目主卡片，它会在 Obsidian 笔记属性中记录一个 uuid ，用来与工作目录下的一个配置文件 `.antinet.json` 进行对应。项目主卡片的子孙主卡片，都是与该项目紧密相关的内容。
4. 在 MCP 远程连接建立之后，Agent 需要调用项目初始化工具 `init_antinet` 来告诉 Antinet MCP Server 当前工作目录是什么。MCP Server 将读取该工作目录中的 `.antinet.json` 并记录下它对应的项目主卡片的编号，并告知给 Agent。如果工作目录未记录过内容，则 MCP Server 将自动在工作目录下创建 `.antinet.json` 配置文件并在 Obsidian 中创建相应的项目主卡片。
5. Antinet MCP Server 提供主卡片读取和写入的相关工具：
	- `read_main_card`: 根据编号读取主卡片内容
	- `list_root_main_card`: 查看所有根节点主卡片，包括编号及主卡片的概要内容
	- `browse_main_card`: 浏览主卡片编号附近的相关主卡片内容（工具名称可以再优化以符合工具描述）
	- `create_main_card`: 创建主卡片（需要区分普通主卡片(global)还是项目主卡片(project)），限制卡片内容长度
	- `append_main_card`: 在主卡片中增加补充性内容，可选择在笔记的最前面或者最后面添加，补充内容长度限制在 200 个字符以内

### 待规划补充设计

1. 除了主卡片盒，还需要建立索引卡片盒和文献卡片盒
2. 提供指导 Agent 如何使用 Antinet MCP Server 的相关提示词，形式可以是 MCP Prompt 或者 Claude Skill 等
3. 设计 Agent 效果正向反馈循环系统，要求能自主不断优化提示 Agent 使用 MCP 工具的效果，让 Agent 越来越熟练使用
