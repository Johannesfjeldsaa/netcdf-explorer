# NetCDF Explorer

A Visual Studio Code extension for exploring NetCDF files. This extension allows you to quickly view the structure and metadata of NetCDF files directly in VSCode.

## Features

- View NetCDF file structure and metadata with a single click
- Support for both Windows and WSL environments
- Automatic generation of markdown documentation for NetCDF files
- Context menu integration for .nc files

## Requirements

- Visual Studio Code 1.85.0 or higher
- Python 3.x with netCDF4 package installed

### For Windows Users:
```bash
# Install Python and netCDF4 package
pip install netCDF4
```

### For WSL Users:
```bash
# Install required packages
sudo apt update
sudo apt install python3 python3-pip
pip3 install netCDF4
```

## Installation

1. Install through VS Code Extensions. Search for "NetCDF Explorer"
2. Install through VSIX file:
   - Download the .vsix file
   - Run `code --install-extension netcdf-explorer-0.0.2.vsix`

## Usage

1. Right-click on a .nc file in the VSCode explorer
2. Select "Show NetCDF Info" from the context menu
3. A new markdown file will be created with the NetCDF file's structure and metadata

## Features in Detail

The extension provides detailed information about your NetCDF files:

- Basic file information (name, size)
- Dimensions
- Variables and their attributes
- Global attributes
- Data types and shapes

## Known Issues

- Some special characters in file paths may cause issues in WSL environment
- Large NetCDF files may take longer to process

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Release Notes

### 0.0.2 (Current)
- Fixed WSL path handling issues
- Improved documentation and README
- Enhanced error handling

### 0.0.1
- Initial release
- Basic NetCDF file information extraction
- Markdown format output
- Support for Chinese paths and content

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

## Why NetCDF Explorer? / 为什么选择NetCDF Explorer?

- **Python-based**: Replace NCL with modern Python ecosystem / 使用Python生态系统替代NCL
- **AI-Ready**: Generate structured metadata for AI programming / 为AI编程生成结构化元数据
- **Integration**: Enhance automation with Cursor, CLine, and GitHub Copilot / 提升使用Cursor、CLine、GitHub Copilot等工具的自动化程度

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

## Contact & Repository / 联系方式与仓库

- **Publisher**: zsy1207
- **Repository**: https://github.com/zsy1207/netcdf-explorer
- **Email**: zhoushiyang1207@outlook.com

## Version History / 版本历史

### 0.0.2 (Current)
- Fixed WSL path handling issues
- Improved documentation and README
- Enhanced error handling

### 0.0.1
- Initial release
- Basic NetCDF file information extraction
- Markdown format output
- Support for Chinese paths and content

