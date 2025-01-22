# NetCDF Explorer / NetCDF文件浏览器

A VSCode extension for quick NetCDF file metadata exploration and AI-assisted scientific programming.

这是一个VSCode扩展，用于快速浏览NetCDF文件元数据并辅助AI科学编程。

## Quick Demo / 快速演示

![Usage Demo](https://raw.githubusercontent.com/zsy1207/netcdf-explorer/main/images/test.gif)

> Note: If the demo GIF is not visible, you can find it in the [GitHub repository](https://github.com/zsy1207/netcdf-explorer/blob/main/images/test.gif).
> 
> 注意：如果演示GIF无法显示，您可以在[GitHub仓库](https://github.com/zsy1207/netcdf-explorer/blob/main/images/test.gif)中查看。

The demo shows how to:
1. View NetCDF file metadata with a right-click
2. Generate a structured .info.md file
3. Use the metadata in Cursor's context for enhanced AI programming

演示展示了如何：
1. 通过右键点击查看NetCDF文件元数据
2. 生成结构化的.info.md文件
3. 将NetCDF文件元数据加入到cursor的context中，提供编程效率和自动化程度

## Requirements / 环境要求

- VSCode 1.85.0+
- Python with netCDF4 (`pip install netCDF4`)
- numpy (`pip install numpy`)

## Why NetCDF Explorer? / 为什么选择NetCDF Explorer?

- **Python-based**: Replace NCL with modern Python ecosystem / 使用Python生态系统替代NCL
- **AI-Ready**: Generate structured metadata for AI programming / 为AI编程生成结构化元数据
- **Integration**: Enhance automation with Cursor, CLine, and GitHub Copilot / 提升使用Cursor、CLine、GitHub Copilot等工具的自动化程度

## Features / 功能特点

- One-click metadata extraction / 一键提取元数据
- Structured Markdown output / 结构化Markdown输出
- Multi-language support / 多语言支持
- Cross-platform (Windows, Linux, WSL2) / 跨平台支持

## Output Format / 输出格式

```markdown
# NetCDF File Information

## Basic Information
- **Filename**: example.nc
- **Size**: 10.5 MB

## Dimensions
- **time**: 12
- **lat**: 180
- **lon**: 360

## Variables
### temperature
- **Type**: float32
- **Shape**: (12, 180, 360)
- **Dimensions**: time(12), lat(180), lon(360)
- **Attributes**:
  - units: Kelvin
  - long_name: Surface Temperature
```

## Troubleshooting / 常见问题

1. **"Show NetCDF Info" missing**: Reload VSCode / 重新加载VSCode
2. **Error reading file**: Check Python and netCDF4 installation / 检查Python和netCDF4安装
3. **Character encoding issues**: Ensure UTF-8 encoding / 确保UTF-8编码

## License / 许可证

MIT

## Contact & Repository / 联系方式与仓库

- **Publisher**: zsy1207
- **Repository**: https://github.com/zsy1207/netcdf-explorer
- **Email**: zhoushiyang1207@outlook.com

## Version History / 版本历史

### 0.0.1 (Current)
- Initial release
- Basic NetCDF file information extraction
- Markdown format output
- Support for Chinese paths and content

