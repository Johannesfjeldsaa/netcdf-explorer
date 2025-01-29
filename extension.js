const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

/**
 * 转换Windows路径为WSL路径
 * @param {string} windowsPath 
 * @returns {string}
 */
function convertWindowsToWSLPath(windowsPath) {
    try {
        // 如果已经是WSL路径，需要特殊处理
        if (windowsPath.startsWith('/')) {
            // 如果是WSL中的home目录路径，直接返回
            if (windowsPath.startsWith('/home/')) {
                return windowsPath;
            }
            // 如果是/mnt路径，清理多余的斜杠
            if (windowsPath.startsWith('/mnt/')) {
                return windowsPath.replace(/\/+/g, '/');
            }
            return windowsPath;
        }

        // 处理UNC路径
        if (windowsPath.startsWith('\\\\')) {
            return windowsPath;
        }

        // 标准化路径分隔符
        const normalizedPath = windowsPath.replace(/\\/g, '/');

        // 检查是否有盘符
        const match = normalizedPath.match(/^([A-Za-z]):/);
        if (!match) {
            // 如果没有盘符，可能是相对路径
            return normalizedPath;
        }

        const driveLetter = match[1].toLowerCase();
        const remainingPath = normalizedPath.slice(2);
        const wslPath = `/mnt/${driveLetter}${remainingPath}`;

        // 移除多余的斜杠
        return wslPath.replace(/\/+/g, '/');
    } catch (error) {
        console.error('Path conversion error:', error);
        return windowsPath;
    }
}

/**
 * 检查WSL环境并获取配置
 * @returns {Promise<{isWSL: boolean, pythonPath: string, wslVersion: number, distroName: string, isNativeWSL: boolean}>}
 */
async function checkWSLEnvironment() {
    try {
        // 检查是否在WSL中原生运行
        if (process.platform === 'linux' && process.env.WSL_DISTRO_NAME) {
            const pythonPath = await getPythonPath();
            return {
                isWSL: true,
                pythonPath,
                wslVersion: process.env.WSL_INTEROP ? 2 : 1,
                distroName: process.env.WSL_DISTRO_NAME,
                isNativeWSL: true
            };
        }

        // 检查是否在Windows上运行
        if (process.platform !== 'win32') {
            return {
                isWSL: false,
                pythonPath: 'python3',
                wslVersion: 0,
                distroName: '',
                isNativeWSL: false
            };
        }

        // 检查WSL是否可用并获取bash路径
        const bashCheck = spawnSync('wsl.exe', ['which', 'bash']);
        if (bashCheck.status !== 0) {
            console.log('WSL bash check failed:', bashCheck.error);
            return {
                isWSL: false,
                pythonPath: 'python.exe',
                wslVersion: 0,
                distroName: '',
                isNativeWSL: false
            };
        }
        const bashPath = bashCheck.stdout.toString().trim();

        // 获取默认WSL发行版
        const distroCheck = spawnSync('wsl.exe', ['-l', '-q']);
        const distroName = distroCheck.stdout.toString().trim().split('\n')[0];

        // 检查WSL版本
        const wslVersionCheck = spawnSync('wsl.exe', ['--version']);
        const wslVersion = wslVersionCheck.status === 0 ? 2 : 1;

        // 获取Python路径
        const pythonPath = await getPythonPath();

        return {
            isWSL: true,
            pythonPath,
            wslVersion,
            distroName,
            isNativeWSL: false,
            bashPath
        };
    } catch (error) {
        console.error('WSL environment check failed:', error);
        return {
            isWSL: false,
            pythonPath: 'python.exe',
            wslVersion: 0,
            distroName: '',
            isNativeWSL: false
        };
    }
}

/**
 * 获取Python路径
 * @returns {Promise<string>}
 */
async function getPythonPath() {
    try {
        if (process.platform === 'linux') {
            const pythonCheck = spawnSync('which', ['python3']);
            if (pythonCheck.status === 0) {
                return pythonCheck.stdout.toString().trim();
            }
        } else if (process.platform === 'win32') {
            // 在Windows上通过WSL检查Python
            const pythonCheck = spawnSync('wsl.exe', ['which', 'python3']);
            if (pythonCheck.status === 0) {
                const pythonPath = pythonCheck.stdout.toString().trim();
                // 验证Python是否可用
                const pythonVerify = spawnSync('wsl.exe', [pythonPath, '--version']);
                if (pythonVerify.status === 0) {
                    return pythonPath;
                }
            }
            // 如果WSL中的Python检查失败，尝试使用默认路径
            return '/usr/bin/python3';
        }
        return 'python3';
    } catch (error) {
        console.error('Python path check failed:', error);
        return '/usr/bin/python3';
    }
}

/**
 * 在WSL中执行命令
 * @param {string} command 
 * @param {Object} options 
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function executeInWSL(command, options = {}) {
    return new Promise((resolve, reject) => {
        // 使用数组形式的命令，避免字符串解析问题
        const wslCommand = [
            'wsl.exe',
            '--exec',  // 使用--exec而不是bash -c
            '/usr/bin/env',
            'bash',
            '-c',
            command
        ];

        console.log('Executing WSL command:', wslCommand.join(' '));

        const process = spawn(wslCommand[0], wslCommand.slice(1), {
            ...options,
            windowsHide: true,
            encoding: 'utf8'
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString('utf8');
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString('utf8');
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });

        process.on('error', (err) => {
            console.error('WSL execution error:', err);
            reject(err);
        });
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Activating NetCDF Explorer extension...');

    let disposable = vscode.commands.registerCommand('netcdf-explorer.showInfo', async (uri) => {
        try {
            console.log('Command triggered with uri:', uri);
            
            // 获取文件路径
            const filePath = uri.fsPath;
            console.log('Processing file:', filePath);
            
            // 获取Python脚本的路径
            const scriptPath = path.join(__dirname, 'read_netcdf.py');
            console.log('Script path:', scriptPath);
            
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                throw new Error(`NetCDF file not found at: ${filePath}`);
            }
            if (!fs.existsSync(scriptPath)) {
                throw new Error(`Python script not found at: ${scriptPath}`);
            }
            
            // 检查环境
            const env = await checkWSLEnvironment();
            console.log('Environment check result:', env);
            
            // 读取netCDF文件
            console.log('Reading netCDF file...');
            const markdownContent = await new Promise((resolve, reject) => {
                let output = '';
                let errorOutput = '';
                
                // 设置环境变量
                const processEnv = Object.assign({}, process.env, {
                    PYTHONIOENCODING: 'utf-8',
                    PYTHONUTF8: '1',
                    PYTHONUNBUFFERED: '1',
                    LANG: 'C.UTF-8',
                    LC_ALL: 'C.UTF-8',
                    PATH: process.env.PATH
                });
                
                let pythonProcess;
                if (env.isWSL) {
                    // 确定脚本路径
                    let effectiveScriptPath;
                    if (env.isNativeWSL) {
                        // 在WSL中原生运行时，直接使用scriptPath
                        effectiveScriptPath = scriptPath;
                    } else {
                        // 从Windows通过WSL运行时，需要转换路径
                        effectiveScriptPath = convertWindowsToWSLPath(scriptPath);
                    }
                    
                    // 确定文件路径
                    let effectiveFilePath;
                    if (env.isNativeWSL) {
                        // 在WSL中原生运行时，直接使用filePath
                        effectiveFilePath = filePath;
                    } else {
                        // 从Windows通过WSL运行时，需要转换路径
                        effectiveFilePath = convertWindowsToWSLPath(filePath);
                    }
                    
                    console.log('Effective paths:', {
                        script: effectiveScriptPath,
                        file: effectiveFilePath
                    });
                    
                    if (env.isNativeWSL) {
                        // 在WSL中原生运行
                        pythonProcess = spawn(env.pythonPath, [
                            '-u',
                            effectiveScriptPath,
                            effectiveFilePath
                        ], {
                            env: processEnv,
                            shell: false
                        });
                    } else {
                        // 通过Windows中的WSL运行
                        // 使用绝对路径和引号处理空格
                        const wslCommand = `cd "${path.dirname(effectiveScriptPath)}" && /usr/bin/env python3 -u "${path.basename(effectiveScriptPath)}" "${effectiveFilePath}"`;
                        console.log('WSL command:', wslCommand);
                        
                        pythonProcess = spawn('wsl.exe', [
                            '--exec',
                            '/usr/bin/env',
                            'bash',
                            '-c',
                            wslCommand
                        ], {
                            env: processEnv,
                            windowsHide: true
                        });
                    }
                } else {
                    // 在本地运行
                    pythonProcess = spawn(env.pythonPath, ['-u', scriptPath, filePath], {
                        env: processEnv,
                        windowsHide: true,
                        shell: false
                    });
                }
                
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString('utf8');
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    const message = data.toString('utf8');
                    errorOutput += message;
                    console.log('Python debug:', message);
                });
                
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(errorOutput || 'Python script failed with no error message'));
                    } else {
                        resolve(output);
                    }
                });
                
                pythonProcess.on('error', (err) => {
                    console.error('Process error:', err);
                    reject(new Error(`Failed to start Python process: ${err.message}`));
                });
            });
            
            // 创建输出文件
            const outputPath = filePath + '.info.md';
            console.log('Creating output file:', outputPath);
            
            // 确保输出目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // 写入文件
            fs.writeFileSync(outputPath, markdownContent, { encoding: 'utf8' });
            
            // 打开文件
            const document = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(document);
            
            vscode.window.showInformationMessage('NetCDF info file created successfully!');
            
        } catch (error) {
            console.error('Error:', error);
            const channel = vscode.window.createOutputChannel('NetCDF Explorer');
            channel.show();
            channel.appendLine('Error details:');
            channel.appendLine(error.message);
            if (error.stack) {
                channel.appendLine('Stack trace:');
                channel.appendLine(error.stack);
            }
            
            vscode.window.showErrorMessage('Error creating NetCDF info file. Check Output panel for details.');
        }
    });
    
    context.subscriptions.push(disposable);
}

function deactivate() {
    console.log('NetCDF Explorer extension deactivated');
}

module.exports = {
    activate,
    deactivate
}; 