# develop-log

阅读 [REDME.md](./README.md)

## Demo

### 20241105-PZP

代码重构

- 将 `ArtiFact` 重命名为 `Artifact`
- 将 `class Artifact` 中的 `context` 提取出来，创建了 `Conext` 类

### 20241106-PZP

文件变动

- 删除 `CHANGELOG.md`
- 创建 `src/common-utils.ts`，用于存放项目需要的通用函数
- 创建 `src/process-utils.ts`，用于存放收集数据的处理函数
- 重写 README 文件

代码重构

- 将 `class Artifact` 中的 `hierarchys` 重命名为 `hierarchy`
- 添加少量注释
- 移植部分函数到  `src/common-utils.ts` 文件中
