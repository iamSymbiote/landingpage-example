const path = require("path");
const glob = require("glob");
const fs = require("fs");
const merge = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const CopyWebpackPlugin = require('copy-webpack-plugin');




const baseConfig = {
    entry: () => new Promise((resolve) => {

        let allEntries = {};

        console.log("------------------");

        ["scripts","styles"].forEach((opt) => {
            const envOpt = opt === "scripts" ? "js" : opt === "styles" ? "css" : null;
            const ext = opt === "scripts" ? ".js" : opt === "styles" ? ".scss" : null;

            let pattern = './assets/src/' + opt + '/' + (process.env[envOpt]  ? process.env[envOpt] : '*') + ext;

            if(!process.env.hasOwnProperty(envOpt)){
                console.log("Platform " + envOpt + " unused (or typo). Running all " + ext + " files..")
            } else {
                function checkFileExistsSync(filepath){
                    let flag = true;
                    try{
                        fs.accessSync(filepath, fs.constants.F_OK);
                    }catch(e){
                        flag = false;
                    }
                    return flag;
                }
                if(checkFileExistsSync(pattern)){
                    console.log(("Platform "+ envOpt +": " + process.env[envOpt]));
                } else {
                    console.error("Unknown platform value [ " + envOpt + "=" + process.env[envOpt] + " => " + pattern + " ] Running all " + ext + " files..");
                    pattern = './assets/src/' + opt + '/' + '*' + ext;
                }


            }

            allEntries = {
                ...allEntries,
                ...glob.sync(pattern).reduce((pathsObj, path) => {
                    const entry = path.match(/([^\/]+)(?=\.\w+$)/)[1];
                    const entryName = opt + "/" + entry.replace(ext, '');
                    pathsObj[entryName] = path;
                    return pathsObj;
                }, {})
            };
        });

        console.log("------------------");

        return resolve(allEntries);
    }),
    output: {
        path: path.resolve(__dirname, "assets/dist"),
        filename: "[name].bundle.js",
        chunkFilename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            ["@babel/preset-env",{
                                debug: false,
                                modules:false,
                                targets: {
                                    browsers: [">0.25%", "not dead"]
                                },
                                useBuiltIns: "usage", // or "entry"
                                corejs: 3
                            }]
                        ]
                    }
                }
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            plugins: () => [
                                require("autoprefixer"),
                                require('cssnano')
                            ]
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass")
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            outputPath: 'images',
                            name: '[name].[ext]'
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2|ttf|otf|eot)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            outputPath: 'fonts'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new FixStyleOnlyEntriesPlugin(),
        new MiniCssExtractPlugin({
            filename: "[name].bundle.css",
            chunkFilename: '[id].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './assets/src/images', to: 'images' }
            ]
        })
    ],
    optimization: {
        namedModules: true
    },
    performance: {
        maxAssetSize: 100000,
        maxEntrypointSize: 400000,
        hints: 'warning'
    }
}

module.exports = function (env,argv) {

    const isDev = argv.mode === "development";

    if(isDev){

        const devServerConfig = {
            devServer : {
                // ipden bağlantı (babelLoader ı dev modda çalıştır ie hata almasın)
                host: "0.0.0.0",
                publicPath: "/assets/dist/", // sayfadaki değişikliği günceller reload olmaz
                writeToDisk: true,
                overlay: true, // hataları gösterir
                hotOnly: true // (hot)
            }
        }

        return merge(
            baseConfig,
            {devtool: "eval-source-map"},
            devServerConfig
        );
    } else {
        return merge(
            baseConfig,
            {devtool: false}
        )
    }

    return baseConfig;
}
