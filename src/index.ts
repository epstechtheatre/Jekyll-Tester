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

    //Setup jekyll and ruby
    const jekyllInstall = exec('gems install jekyll bundler', {
        cwd: working
    }, (err, stdout, stdin) => {
        if (err) {
            core.setFailed("Failed to install Jekyll, Bundler");
        }
    })
    jekyllInstall.stderr?.pipe(process.stderr)
    jekyllInstall.stdout?.pipe(process.stdout);

    jekyllInstall.on("exit", () => {
        //Setup gemfile
        const installGems = exec("bundle install", {
            cwd: working
        });

        installGems.stdout?.pipe(process.stdout);
        installGems.stderr?.pipe(process.stderr);

        installGems.on("exit", () => {
            let success = false;
            function unexpectedExit() {
                core.setFailed("Jekyll Failed to Launch")
            }

            //Attempt to run jekyll, register an onExit function that will be disabled if we detect that the website is working
            const jekyllProcess = spawn(`bundle`, [`exec`, `jekyll`, `serve`], {
                cwd: working
            });
            jekyllProcess.on("exit", unexpectedExit)
            jekyllProcess.stderr.pipe(process.stderr);
            jekyllProcess.stdout.on("data", (data: string) => {
                if (data.toLowerCase().search("server running") !== -1 && !success) {
                    jekyllProcess.off("exit", unexpectedExit);
                    success = true;

                    jekyllProcess.kill();
                    core.setOutput("success", true);
                }
            })
        })
    })
}

run();