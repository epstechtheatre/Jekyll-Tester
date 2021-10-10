import * as core from "@actions/core";
import * as github from "@actions/github";
import {spawn, exec} from "child_process";
import fs from "fs";

async function run() {
    let path = core.getInput("path");
    if (!path) path = "";
    if (path.startsWith("/") || path.startsWith("\\")) {
        path = path.substring(1); 
    }

    const working = `${process.cwd()}${path.length > 0 ? "/" + path : "" }`

    if (!fs.existsSync(`${process.cwd()}/${path}`)) {
        core.setFailed(`Path ${path} not found!`);
        return; 
    }

    function installJekyllBundler() {
        let success = false;
        //Setup jekyll and ruby
        const jekyllInstall = exec('gems install jekyll bundler', {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("Bundle complete!")) {
                    jekyllInstall.off("exit", unexpectedGemExit);
                    jekyllInstall.on("exit", installGemfileGems);

                    success = true;
                }
            }
        })
        jekyllInstall.on("exit", unexpectedGemExit);
        jekyllInstall.stderr?.pipe(process.stderr)
        jekyllInstall.stdout?.pipe(process.stdout);
    }

    function installGemfileGems() {
        let success = false;
        //Setup gemfile
        const installGems = exec("bundle install", {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("Bundle complete!")) {
                    installGems.off("exit", unexpectedGemExit);
                    installGems.on("exit", runJekyll);
                    success = true;
                }
            }
        });
        installGems.on("exit", unexpectedGemExit);

        installGems.stdout?.pipe(process.stdout);
        installGems.stderr?.pipe(process.stderr);
    }

    function runJekyll () {
        function unexpectedJekyllExit() {
            core.setFailed("Failed to build Jekyll site")
        }
        let success = false;

        //Attempt to run jekyll, register an onExit function that will be disabled if we detect that the website is working
        const jekyllProcess = spawn(`bundle`, [`exec`, `jekyll`, `serve`], {
            cwd: working
        });
        jekyllProcess.on("exit", unexpectedJekyllExit)
        jekyllProcess.stderr.pipe(process.stderr);
        jekyllProcess.stdout.on("data", (data) => {
            if (data.toString().search("Server running...") !== -1 && !success) {
                jekyllProcess.off("exit", unexpectedJekyllExit);
                success = true;

                jekyllProcess.kill();
                core.setOutput("success", true);
            }
        })
    }
}

function unexpectedGemExit() {
    core.setFailed("Failed to Install Gems, Bundle, or Jekyll")
}

run();