const fs = require("fs");
const path = require("path");
const server = require('../server/server');

const cwd = process.cwd();
const pkgDir = path.join(cwd, "package.json");
const nodeModulesDir = path.join(cwd, "node_modules");
const npmLock = path.join(cwd, "package-lock.json");
const yarnLock = path.join(cwd, "yarn.lock");
const pnpmLock = path.join(cwd, "pnpm-lock.yaml");
const isExistPkgJson = fs.existsSync(pkgDir);
const isExistNodeModules = fs.existsSync(nodeModulesDir);
const isNPM = fs.existsSync(npmLock);
const isYARN = fs.existsSync(yarnLock);
const isPNPM = fs.existsSync(pnpmLock);

// 判断是否为根目录、即是否含有package.json文件
if (!isExistPkgJson) {
    throw new Error("\x1b[31mThe packaga.json file was not found in the current directory. Make sure the current working directory is the root directory\x1b[0m");
}

// 判断是否已经下载依赖，即是否存在node_modules
if (!isExistNodeModules) {
    throw new Error("not contain node_modules");
}

// 判断当前项目所使用的包管理工具是什么 yarn、pnpm、npm

const content = fs.readFileSync(pkgDir, {
    encoding: "utf-8"
});

const { dependencies: dep } = JSON.parse(content);

class DepGraph {
    constructor() {
        this.nodes = []
        this.edges = []
    }

    insertNode(nodeName, version, category) {
        if (!this.nodes.find((node) => { return node.name === nodeName })) {
            this.nodes.push({ name: nodeName, value: version, category})
        }
    }

    insertEgde(fromNode, toNode) {
        if (this.nodes.find((node) => { return node.name === fromNode }) && this.nodes.find((node) => { return node.name === toNode })) {
            this.edges.push({ source: fromNode, target: toNode })
        }
    }
}

const depGraph = new DepGraph();

function checkDep(dep, parentDep, level = 0) {
    for (const key in dep) {
        depGraph.insertNode(key, dep[key], level)
        depGraph.insertEgde(parentDep, key)
        const nestedPkgJson = path.join(nodeModulesDir, key, "package.json");
        const content = fs.readFileSync(nestedPkgJson, {
            encoding: "utf-8"
        });
        const { dependencies: childDep } = JSON.parse(content)
        checkDep(childDep, key, level+1)
    }
}
checkDep(dep)

server(depGraph)