# 管理员更新说明

本仓库的公开页面只负责查看和下载。数据源 Excel 不上传到公开仓库。

## 权限

只有仓库的 `Write`、`Maintain` 或 `Admin` 成员可以更新看板。普通查看人员保持 `Read` 权限，只能打开公开链接和导出筛选结果。

## 更新步骤

1. 在管理员电脑上保留最新 Excel 文件，不要把 Excel 上传到 GitHub。
2. 将 Excel 文件拖到 `admin/update-dashboard.cmd` 上，或在命令行运行：

   `admin\\update-dashboard.cmd "C:\\path\\JT二部已成功上标(绿标)ASIN列表-YYYYMMDD更新.xlsx"`

   脚本会优先使用电脑已安装的 Python 和 Node.js；在安装了 Codex 的当前电脑上，也会自动尝试 Codex 自带的运行环境。若普通电脑缺少依赖，请先安装 Python 3、Node.js，并运行 `python -m pip install openpyxl`。

3. 脚本会生成 `admin/generated/index.html`。
4. 登录 GitHub，打开仓库的 `Add file` → `Upload files`，只上传 `admin/generated/index.html`。GitHub 会用它替换仓库根目录同名的 `index.html`。
5. 提交信息建议使用：`Update dashboard data YYYY-MM-DD`。
6. 等待 GitHub Pages 部署完成，然后打开：

   `https://kateline8888-arch.github.io/jt-dashboard/`

## 回滚

如果新版本有问题，打开 GitHub 的 `Commits`，进入上一个正常提交，选择恢复或重新上传上一版 `index.html`。不要删除仓库，也不要上传 Excel 源文件。

## 校验重点

- 页面更新时间是否与新 Excel 文件名一致。
- ASIN 总数、成功数、失败数和待处理数是否合理。
- 品类和运营是否显示为未匹配。
- 筛选、重置和 CSV 下载是否正常。
