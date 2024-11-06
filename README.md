# virtualme-demo README

收集开发者在IDE内的动作数据，用于开发者意图预测等相关研究。

> https://code.visualstudio.com/api/references/vscode-api

## 开发前准备

1. 将仓库克隆到本地
2. 执行 `npm install` 安装项目依赖
3. 在编辑器中，打开 `src/extension.ts` 文件，然后按 `F5` 或者从命令面板运行 `Debug: Start Debugging`，这将编译并运行扩展程序在一个新的扩展开发主机窗口中；

   > 如果发现修改了代码而没在插件中生效，可以先在控制台执行 `npm run watch` 再尝试运行
   >

## 开发记录

在更改项目源代码后请将修改内容记录到 [develop-log.md](./develop-log.md) 中。

## 项目结构

> 展示部分值得关注的文件夹和文件

文件夹

- `log` 保存收集的开发者动作数据
- `src` 源代码文件夹

文件

- `src/extension.ts` 插件入口文件，导出两个函数 `activate` 和 `deactivate`
- `src/log-item.ts`  定义收集数据的数据项的具体表示方式和数据结构
- `src/common-utils.ts` 实现项目需要的通用函数
- `src/process-utils.ts` 实现收集数据的处理函数
- `develop-log.md` 记录开发过程对项目的修改内容
- `esbuild.js` 使用 esbuild 构建项目的配置文件
- `package.json` 项目的配置文件，可配置插件属性
- `package-lock.json` 锁定项目的依赖版本
- `tsconfig.json` TypeScript 的配置文件
