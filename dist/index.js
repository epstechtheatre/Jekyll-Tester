"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
async function run() {
    let path = core.getInput("path");
    if (!path)
        path = "";
    if (path.startsWith("/") || path.startsWith("\\")) {
        path = path.substring(1);
    }
    const working = `${process.cwd()}${path.length > 0 ? "/" + path : ""}`;
    if (!fs_1.default.existsSync(`${process.cwd()}/${path}`)) {
        core.setFailed(`Path ${path} not found!`);
        return;
    }
    console.log(`Running with cwd: ${working}`);
    installJekyllBundler();
    function installJekyllBundler() {
        var _a, _b;
        let success = false;
        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to install Jekyll, Bundler!");
                }
                else {
                    installGemfileGems();
                }
            }, 500);
        }
        console.log("Attempting to Install Jekyll, Bundler!");
        const jekyllInstall = (0, child_process_1.exec)('gem install jekyll bundler', {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("gems installed") > -1) {
                    console.log("Success!");
                    success = true;
                }
            }
        });
        jekyllInstall.on("exit", onExit);
        (_a = jekyllInstall.stderr) === null || _a === void 0 ? void 0 : _a.pipe(process.stderr);
        (_b = jekyllInstall.stdout) === null || _b === void 0 ? void 0 : _b.pipe(process.stdout);
    }
    function installGemfileGems() {
        var _a, _b;
        let success = false;
        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to install Gems from Gemfile!");
                }
                else {
                    runJekyll();
                }
            }, 500);
        }
        console.log("Attempting to Install Gems Required for Website!");
        const installGems = (0, child_process_1.exec)("bundle install", {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("Bundle complete!")) {
                    console.log("Success!");
                    success = true;
                }
            }
        });
        installGems.on("exit", onExit);
        (_a = installGems.stdout) === null || _a === void 0 ? void 0 : _a.pipe(process.stdout);
        (_b = installGems.stderr) === null || _b === void 0 ? void 0 : _b.pipe(process.stderr);
    }
    function runJekyll() {
        let success = true;
        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to build Jekyll site");
                }
                else {
                    core.setOutput("success", true);
                }
            }, 500);
        }
        const jekyllProcess = (0, child_process_1.spawn)(`bundle`, [`exec`, `jekyll`, `build`, `-d`, `test`], {
            cwd: working
        });
        jekyllProcess.on("exit", onExit);
        jekyllProcess.stderr.pipe(process.stderr);
        jekyllProcess.stderr.on("data", (data) => {
            if (data.toString().search("GitHub Metadata:") > -1)
                return;
            console.error("Error Detected");
            success = false;
            jekyllProcess.kill();
        });
    }
}
run();
