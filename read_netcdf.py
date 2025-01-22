import sys
import json
import traceback
import os
from pathlib import Path
import locale

# 设置默认编码为UTF-8
if sys.platform == 'win32':
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, 'zh_CN.UTF-8')
        except locale.Error:
            pass

print("Python version:", sys.version, file=sys.stderr)
print("Python executable:", sys.executable, file=sys.stderr)
print("Current working directory:", os.getcwd(), file=sys.stderr)
print("Default encoding:", sys.getdefaultencoding(), file=sys.stderr)
print("Filesystem encoding:", sys.getfilesystemencoding(), file=sys.stderr)
print("Locale:", locale.getpreferredencoding(), file=sys.stderr)

try:
    import netCDF4 as nc
    print("netCDF4 version:", nc.__version__, file=sys.stderr)
except ImportError as e:
    print("Error importing netCDF4:", str(e), file=sys.stderr)
    print("Please ensure netCDF4 is installed correctly", file=sys.stderr)
    sys.exit(1)

import numpy as np

def format_value(value):
    """Format value to be more readable"""
    if isinstance(value, (list, np.ndarray)):
        if len(value) > 5:
            # If list is too long, only show first few elements
            return f"{str(value[:5])[:-1]}, ...] ({len(value)} elements)"
        return str(value)
    return str(value)

def get_shape_info(var):
    """Get shape information of a variable"""
    if hasattr(var, 'shape'):
        return str(var.shape)
    return "N/A"

def normalize_path(file_path):
    """规范化文件路径，处理中文路径问题"""
    try:
        # 如果是bytes，尝试解码
        if isinstance(file_path, bytes):
            try:
                file_path = file_path.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    file_path = file_path.decode('gbk')
                except UnicodeDecodeError:
                    file_path = file_path.decode('windows-1252')

        # 转换为Path对象
        path = Path(file_path)
        
        # 获取绝对路径
        abs_path = str(path.resolve())
        
        print(f"Original path: {file_path}", file=sys.stderr)
        print(f"Normalized path: {abs_path}", file=sys.stderr)
        
        # 检查文件是否存在
        if not path.exists():
            raise FileNotFoundError(f"File not found: {abs_path}")
            
        return abs_path
        
    except Exception as e:
        print(f"Path normalization error: {str(e)}", file=sys.stderr)
        return file_path

def get_netcdf_info(file_path):
    try:
        # Normalize path
        normalized_path = normalize_path(file_path)
        print(f"Trying to open file: {normalized_path}", file=sys.stderr)
        
        # Try different ways to open the file
        try:
            dataset = nc.Dataset(normalized_path, 'r')
        except:
            # If opening with normalized path fails, try original path
            print("Failed to open with normalized path, trying original path...", file=sys.stderr)
            dataset = nc.Dataset(file_path, 'r')
        
        print("File opened successfully", file=sys.stderr)
        
        # Get global attributes
        print("Reading global attributes...", file=sys.stderr)
        global_attrs = {}
        for attr in dataset.ncattrs():
            value = dataset.getncattr(attr)
            # Convert numpy array to list
            if isinstance(value, np.ndarray):
                value = value.tolist()
            # Convert numpy numeric types to Python native types
            elif isinstance(value, (np.int32, np.int64)):
                value = int(value)
            elif isinstance(value, (np.float32, np.float64)):
                value = float(value)
            # Ensure strings use UTF-8 encoding
            elif isinstance(value, str):
                value = value.encode('utf-8', errors='replace').decode('utf-8')
            global_attrs[attr] = value
        print(f"Found {len(global_attrs)} global attributes", file=sys.stderr)
        
        # Get dimension information
        print("Reading dimensions...", file=sys.stderr)
        dimensions = {}
        for dim_name, dim in dataset.dimensions.items():
            dimensions[dim_name] = len(dim)
        print(f"Found {len(dimensions)} dimensions", file=sys.stderr)
        
        # Get variable information
        print("Reading variables...", file=sys.stderr)
        variables = {}
        for var_name, var in dataset.variables.items():
            var_info = {
                'dimensions': var.dimensions,
                'type': str(var.dtype),
                'shape': get_shape_info(var),
                'attributes': {}
            }
            
            # Get variable attributes
            for attr in var.ncattrs():
                value = var.getncattr(attr)
                # Convert numpy array to list
                if isinstance(value, np.ndarray):
                    value = value.tolist()
                # Convert numpy numeric types to Python native types
                elif isinstance(value, (np.int32, np.int64)):
                    value = int(value)
                elif isinstance(value, (np.float32, np.float64)):
                    value = float(value)
                # Ensure strings use UTF-8 encoding
                elif isinstance(value, str):
                    value = value.encode('utf-8', errors='replace').decode('utf-8')
                var_info['attributes'][attr] = value
            
            variables[var_name] = var_info
        print(f"Found {len(variables)} variables", file=sys.stderr)
        
        # Close file
        dataset.close()
        print("File closed successfully", file=sys.stderr)
        
        return {
            'globalAttributes': global_attrs,
            'dimensions': dimensions,
            'variables': variables
        }
    except Exception as e:
        print(f"Error in get_netcdf_info: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def create_markdown(info, file_path, size_mb):
    """Convert netCDF information to Markdown format"""
    try:
        lines = []
        
        # Add file basic information
        lines.append("# NetCDF File Information\n")
        lines.append("## Basic Information")
        
        # Ensure filename and path use UTF-8 encoding
        filename = os.path.basename(file_path)
        if isinstance(filename, bytes):
            filename = filename.decode('utf-8', errors='replace')
        
        lines.append(f"- **Filename**: {filename}")
        lines.append(f"- **Path**: {file_path}")
        lines.append(f"- **Size**: {size_mb} MB\n")
        
        # Add dimension information
        lines.append("## Dimensions")
        for dim_name, dim_size in info['dimensions'].items():
            lines.append(f"- **{dim_name}**: {dim_size}")
        lines.append("")
        
        # Add global attributes
        if info['globalAttributes']:
            lines.append("## Global Attributes")
            for attr_name, attr_value in info['globalAttributes'].items():
                # Ensure attribute values use UTF-8 encoding
                if isinstance(attr_value, str):
                    attr_value = attr_value.encode('utf-8', errors='replace').decode('utf-8')
                lines.append(f"- **{attr_name}**: {format_value(attr_value)}")
            lines.append("")
        
        # Add variable information
        lines.append("## Variables")
        for var_name, var_info in info['variables'].items():
            lines.append(f"### {var_name}")
            lines.append(f"- **Type**: {var_info['type']}")
            lines.append(f"- **Shape**: {var_info.get('shape', 'N/A')}")
            # Add dimension size information for each dimension
            dimensions_with_size = [f"{dim}({info['dimensions'][dim]})" for dim in var_info['dimensions']]
            lines.append(f"- **Dimensions**: {', '.join(dimensions_with_size)}")
            if var_info['attributes']:
                lines.append("- **Attributes**:")
                for attr_name, attr_value in var_info['attributes'].items():
                    # Ensure attribute values use UTF-8 encoding
                    if isinstance(attr_value, str):
                        attr_value = attr_value.encode('utf-8', errors='replace').decode('utf-8')
                    lines.append(f"  - {attr_name}: {format_value(attr_value)}")
            lines.append("")
        
        # Join all lines and ensure UTF-8 encoding
        content = "\n".join(lines)
        return content.encode('utf-8', errors='replace').decode('utf-8')
        
    except Exception as e:
        print(f"Error in create_markdown: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python read_netcdf.py <netcdf_file_path>', file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    try:
        print(f"Starting to process file: {file_path}", file=sys.stderr)
        info = get_netcdf_info(file_path)
        print("Successfully got netCDF info", file=sys.stderr)
        
        # 获取文件大小
        size_bytes = os.path.getsize(file_path)
        size_mb = f"{(size_bytes / (1024 * 1024)):.2f}"
        
        # 创建Markdown格式输出
        markdown_content = create_markdown({
            'filename': os.path.basename(file_path),
            'globalAttributes': info['globalAttributes'],
            'dimensions': info['dimensions'],
            'variables': info['variables']
        }, file_path, size_mb)
        
        # 确保输出使用UTF-8编码
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout.buffer.write(markdown_content.encode('utf-8'))
        else:
            print(markdown_content)
        
    except Exception as e:
        print(f"Error reading netCDF file: {str(e)}", file=sys.stderr)
        print("Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1) 