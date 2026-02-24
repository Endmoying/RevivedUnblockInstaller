const esbuild = require('esbuild');
const { lessLoader } = require('esbuild-plugin-less');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');

const resources = ['manifest.json', 'preview.png'];
const copyFiles = (destDir) => {
    resources.forEach(file => {
        const srcPath = path.resolve(__dirname, 'resources', file);
        const destPath = path.resolve(__dirname, destDir, file);
        fs.copyFileSync(srcPath, destPath);
    });
};

!(async () => {
    if (isDev) {
        await esbuild.build({
            entryPoints: ['./src/main.tsx', './src/startup_script.ts', './src/style.less'],
            bundle: true,
            sourcemap: 'inline',
            target: 'chrome91',
            outdir: '.',
            plugins: [lessLoader()],
        });
        copyFiles('.');
    } else {
        await esbuild.build({
            entryPoints: ['./src/main.tsx', './src/startup_script.ts', './src/style.less'],
            bundle: true,
            minify: true,
            outdir: 'dist',
            target: 'chrome91',
            plugins: [lessLoader()],
        });
        // 读取 package.json 中的版本信息
        const packageJsonPath = path.resolve(__dirname, 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const version = packageData.version;
        
        // 更新 plugins.json 中的版本信息和 update_time
        const pluginsJsonPath = path.resolve(__dirname, 'plugins.json');
        if (fs.existsSync(pluginsJsonPath)) {
            const pluginData = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf8'));
            pluginData.version = version;
            pluginData.update_time = Date.now();
            fs.writeFileSync(pluginsJsonPath, JSON.stringify(pluginData, null, 2));
            console.log('Updated version and update_time in plugins.json');
        }
        
        // 更新 manifest.json 中的版本信息
        const manifestJsonPath = path.resolve(__dirname, 'resources', 'manifest.json');
        if (fs.existsSync(manifestJsonPath)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
            manifestData.version = version;
            fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestData, null, 2));
            console.log('Updated version in manifest.json');
        }
        copyFiles('dist');

        const compress = require('compressing');
        await compress.zip.compressDir('./dist/', './RevivedUnblockNeteaseMusic.plugin', { ignoreBase: true });
    }
})()