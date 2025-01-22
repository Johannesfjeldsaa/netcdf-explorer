const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * 转换Windows路径为WSL路径
 * @param {string} windowsPath 
 * @returns {string}
 */
function convertWindowsToWSLPath(windowsPath) {
    // 移除盘符并将反斜杠转换为正斜杠
    const driveLetter = windowsPath.charAt(0).toLowerCase();
    return `/mnt/${driveLetter}${windowsPath.slice(2).replace(/\\/g, '/')}`;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Activating NetCDF Explorer extension...');

    let disposable = vscode.commands.registerCommand('netcdf-explorer.showInfo', async (uri) => {
        try {
            console.log('Command triggered with uri:', uri);
            
            // 获取文件路径并规范化
            const filePath = uri.fsPath;
            // 使用path.normalize确保路径格式正确
            const normalizedPath = path.normalize(filePath);
            console.log('Processing file:', normalizedPath);
            
            // 获取Python脚本的路径
            const scriptPath = path.join(__dirname, 'read_netcdf.py');
            console.log('Script path:', scriptPath);
            
            // 检查Python脚本是否存在
            if (!fs.existsSync(scriptPath)) {
                throw new Error(`Python script not found at: ${scriptPath}`);
            }
            
            // 检查netCDF文件是否存在
            if (!fs.existsSync(normalizedPath)) {
                throw new Error(`NetCDF file not found at: ${normalizedPath}`);
            }
            
            // 检测是否在WSL环境中
            const isWSL = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
            console.log('WSL environment detected:', isWSL);
            
            // 读取netCDF文件
            console.log('Reading netCDF file...');
            const markdownContent = await new Promise((resolve, reject) => {
                let output = '';
                let errorOutput = '';
                
                // 设置环境变量以支持UTF-8
                const env = Object.assign({}, process.env, {
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONUTF8: '1',
                    PYTHONLEGACYWINDOWSFSENCODING: 'utf-8',
                    PYTHONIOENCODING: 'utf-8:surrogateescape',
                    LANG: 'C.UTF-8',
                    LC_ALL: 'C.UTF-8'
                });
                
                // 根据环境选择Python命令和路径
                let pythonCommand, targetPath, targetScriptPath;
                if (isWSL) {
                    pythonCommand = 'python3';
                    targetPath = convertWindowsToWSLPath(normalizedPath);
                    targetScriptPath = convertWindowsToWSLPath(scriptPath);
                } else {
                    pythonCommand = process.platform === 'win32' ? 'python.exe' : 'python';
                    targetPath = normalizedPath;
                    targetScriptPath = scriptPath;
                }
                
                console.log('Using Python command:', pythonCommand);
                console.log('Target file path:', targetPath);
                console.log('Target script path:', targetScriptPath);
                
                const pythonProcess = spawn(pythonCommand, [
                    '-u',  // 使用无缓冲输出
                    targetScriptPath,
                    targetPath
                ], {
                    env: env,
                    windowsHide: true,  // 防止显示命令窗口
                    encoding: 'utf8',
                    shell: isWSL  // 在WSL中使用shell
                });
                
                pythonProcess.stdout.setEncoding('utf8');
                pythonProcess.stderr.setEncoding('utf8');
                
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString('utf8');
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString('utf8');
                    // 将调试信息输出到控制台
                    console.log('Python debug:', data.toString('utf8'));
                });
                
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(errorOutput || 'Python script failed with no error message'));
                    } else {
                        resolve(output);
                    }
                });
                
                pythonProcess.on('error', (err) => {
                    reject(new Error(`Failed to start Python process: ${err.message}`));
                });
            });
            console.log('NetCDF file read successfully');
            
            // 创建输出文件
            const outputPath = normalizedPath + '.info.md';
            console.log('Creating output file:', outputPath);
            
            // 确保输出目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // 使用UTF-8编码写入文件
            fs.writeFileSync(outputPath, markdownContent, { encoding: 'utf8' });
            
            // 在VSCode中打开新创建的文件
            console.log('Opening output file in editor...');
            const document = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(document);
            
            vscode.window.showInformationMessage('NetCDF info file created successfully!');
            console.log('Operation completed successfully');
            
        } catch (error) {
            console.error('Error:', error);
            // 创建错误输出通道
            const channel = vscode.window.createOutputChannel('NetCDF Explorer');
            channel.show();
            channel.appendLine('Error details:');
            channel.appendLine(error.message);
            
            vscode.window.showErrorMessage('Error creating NetCDF info file. Check Output panel for details.');
        }
    });
    
    context.subscriptions.push(disposable);
    console.log('NetCDF Explorer extension activated');
}

function deactivate() {
    console.log('NetCDF Explorer extension deactivated');
}

module.exports = {
    activate,
    deactivate
}; 