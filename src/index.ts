import * as core from "@actions/core";
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

    console.log(`Running with cwd: ${working}`);

    installJekyllBundler();

    function installJekyllBundler() { //Setup jekyll and ruby

        let success = false;

        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to install Jekyll, Bundler!")
                } else {
                    installGemfileGems();
                }
            }, 500)
        }
        console.log("Attempting to Install Jekyll, Bundler!")

        const jekyllInstall = exec('gem install jekyll bundler', {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("gems installed") > -1) {
                    console.log("Success!")
                    success = true;
                }
            }
        })
        jekyllInstall.on("exit", onExit);
        jekyllInstall.stderr?.pipe(process.stderr)
        jekyllInstall.stdout?.pipe(process.stdout);
    }

    function installGemfileGems() { //Setup gems from gemfile
        let success = false;

        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to install Gems from Gemfile!")
                } else {
                    runJekyll();
                }
            }, 500)
        }
        console.log("Attempting to Install Gems Required for Website!")

        const installGems = exec("bundle install", {
            cwd: working
        }, (err, stdout) => {
            if (stdout && !success) {
                if (stdout.search("Bundle complete!")) {
                    console.log("Success!")
                    success = true;
                }
            }
        });
        installGems.on("exit", onExit);

        installGems.stdout?.pipe(process.stdout);
        installGems.stderr?.pipe(process.stderr);
    }

    function runJekyll () {
        let success = true;

        function onExit() {
            setTimeout(() => {
                if (!success) {
                    core.setFailed("Failed to build Jekyll site")
                } else {
                    core.setOutput("success", true);
                }
            }, 500);
        }

        //Attempt to run jekyll, register an onExit function that will be disabled if we detect that the website is working
        const jekyllProcess = spawn(`bundle`, [`exec`, `jekyll`, `build`, `-d`, `test`], {
            cwd: working
        });
        jekyllProcess.on("exit", onExit)
        jekyllProcess.stderr.pipe(process.stderr);
        jekyllProcess.stderr.on("data", (data) => {
            if (data.toString().search("GitHub Metadata:") > -1) return;
            console.error("Error Detected");
            success = false;
            jekyllProcess.kill();
        })
    }
}

run();